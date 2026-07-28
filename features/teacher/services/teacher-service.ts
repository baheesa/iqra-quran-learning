import { DEFAULT_LEARNER_ID } from "@/features/learning/constants";
import type { LearningEngine } from "@/features/learning/create-engine";
import type { ContextBuilder } from "@/features/teacher/services/context-builder";
import type { ConversationService } from "@/features/teacher/services/conversation-service";
import type { ExplanationService } from "@/features/teacher/services/explanation-service";
import type { KnowledgeRetriever } from "@/features/teacher/services/knowledge-retriever";
import type { PromptService } from "@/features/teacher/services/prompt-service";
import type { ResponseFormatter } from "@/features/teacher/services/response-formatter";
import type { SuggestionService } from "@/features/teacher/services/suggestion-service";
import type { TeacherLlmProvider } from "@/features/teacher/providers/llm-provider";
import type {
  TeacherAskInput,
  TeacherIntent,
  TeacherResponse,
} from "@/features/teacher/types";

function resolveIntent(input: TeacherAskInput): TeacherIntent {
  if (input.intent) {
    return input.intent;
  }
  if (input.ruleId) {
    return "RULE";
  }
  if (input.lessonId && !input.reading?.selectedWord) {
    return "LESSON";
  }
  if (input.reading?.selectedWord || input.reading?.selectedPhrase) {
    return "WORD";
  }
  return "ASK";
}

/**
 * TeacherService — HOW to explain. Learning Engine decides WHAT.
 */
export function createTeacherService(deps: {
  learning: LearningEngine;
  contextBuilder: ContextBuilder;
  knowledgeRetriever: KnowledgeRetriever;
  promptService: PromptService;
  conversations: ConversationService;
  explanation: ExplanationService;
  suggestions: SuggestionService;
  formatter: ResponseFormatter;
  llm: TeacherLlmProvider;
}) {
  return {
    async previewContext(input: TeacherAskInput) {
      const intent = resolveIntent(input);
      const knowledge = await deps.knowledgeRetriever.retrieve({
        arabic: input.reading?.selectedWord?.arabic ?? null,
        lessonId: input.lessonId ?? deps.learning.lessons.getCurrentLessonId(),
        ruleId: input.ruleId ?? null,
        question: input.question,
      });
      const context = deps.contextBuilder.build({
        ask: { ...input, intent },
        knowledge,
      });
      return { intent, context, knowledge };
    },

    async ask(input: TeacherAskInput): Promise<TeacherResponse> {
      const intent = resolveIntent(input);
      const question =
        input.question.trim() ||
        (input.reading?.selectedWord
          ? `اس لفظ کی وضاحت کریں: ${input.reading.selectedWord.arabic}`
          : "مدد چاہیے");

      const knowledge = await deps.knowledgeRetriever.retrieve({
        arabic: input.reading?.selectedWord?.arabic ?? null,
        lessonId: input.lessonId ?? deps.learning.lessons.getCurrentLessonId(),
        ruleId: input.ruleId ?? null,
        question,
      });

      const context = deps.contextBuilder.build({
        ask: { ...input, intent, question },
        knowledge,
      });

      const prompt = await deps.promptService.buildTeacherPrompt({
        intent,
        question,
        context,
        knowledge,
      });

      let rawAnswer: string;
      try {
        rawAnswer = await deps.llm.complete({
          system: prompt.system,
          user: prompt.user,
        });
      } catch {
        rawAnswer = "";
      }

      if (!rawAnswer.trim()) {
        rawAnswer = deps.explanation.explain({
          intent,
          question,
          context,
          knowledge,
        });
      }

      const formatted = deps.formatter.format({ answer: rawAnswer });
      const suggestions = deps.suggestions.suggest(context);

      const conversation = deps.conversations.ensure(
        input.conversationId,
        question.slice(0, 60),
      );

      deps.conversations.append({
        conversationId: conversation.id,
        role: "LEARNER",
        intent,
        content: question,
        contextSnapshot: context,
        knowledgeRefs: knowledge.references,
      });

      const teacherMessage = deps.conversations.append({
        conversationId: conversation.id,
        role: "TEACHER",
        intent,
        content: formatted.answer,
        contextSnapshot: context,
        knowledgeRefs: knowledge.references,
        promptVersion: prompt.promptVersion,
        provider: deps.llm.name,
      });

      const selectedArabic = context.reading.selectedWord?.arabic;
      const matchedVocab = knowledge.vocabulary[0];
      const progress = matchedVocab
        ? deps.learning.vocabulary.get(matchedVocab.id)
        : null;

      const usedMuallimKnowledge = knowledge.references.some(
        (item) => item.kind === "muallim_approved",
      );

      return {
        conversationId: conversation.id,
        messageId: teacherMessage.id,
        answer: formatted.answer,
        intent,
        promptVersion: prompt.promptVersion,
        provider: deps.llm.name,
        context,
        knowledgeRefs: knowledge.references,
        relatedLesson: context.relatedLesson,
        relatedRule: context.relatedRule,
        vocabularyStatus: matchedVocab
          ? {
              id: matchedVocab.id,
              arabic: matchedVocab.arabic,
              stage: progress?.stage ?? "UNKNOWN",
              confidence: progress?.confidence ?? 0,
            }
          : selectedArabic
            ? {
                id: context.reading.selectedWord!.id,
                arabic: selectedArabic,
                stage: "UNKNOWN",
                confidence: 0,
              }
            : null,
        suggestions,
        encourageReading: formatted.encourageReading,
        usedMuallimKnowledge,
      };
    },

    explainWord(input: Omit<TeacherAskInput, "intent"> & { arabic?: string }) {
      return this.ask({
        ...input,
        intent: "WORD",
        question:
          input.question ||
          `اس لفظ کی پہچان میں مدد کریں: ${input.reading?.selectedWord?.arabic ?? input.arabic ?? ""}`,
      });
    },

    explainLesson(
      input: Omit<TeacherAskInput, "intent"> & { lessonId: string },
    ) {
      return this.ask({
        ...input,
        intent: "LESSON",
        lessonId: input.lessonId,
        question: input.question || "اس سبق کی مختصر رہنمائی دیں",
      });
    },

    explainRule(input: Omit<TeacherAskInput, "intent"> & { ruleId: string }) {
      return this.ask({
        ...input,
        intent: "RULE",
        ruleId: input.ruleId,
        question: input.question || "اس معلم قاعدے کی سادہ وضاحت دیں",
      });
    },
  };
}

export type TeacherService = ReturnType<typeof createTeacherService>;

export { DEFAULT_LEARNER_ID };
