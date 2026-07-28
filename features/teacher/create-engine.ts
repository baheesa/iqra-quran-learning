import { DEFAULT_LEARNER_ID } from "@/features/learning/constants";
import {
  createLearningEngine,
  type LearningEngine,
} from "@/features/learning/create-engine";
import type { AdaptationEngine } from "@/features/personalization/services/adaptation-engine";
import { resolveLiveAiBackend } from "@/features/knowledge/providers/ai-provider-config";
import {
  createClaudeTeacherLlmProvider,
  createOpenAiTeacherLlmProvider,
  createStubTeacherLlmProvider,
  type TeacherLlmProvider,
} from "@/features/teacher/providers/llm-provider";
import { createFileConversationRepository } from "@/features/teacher/repository/file-conversation-repository";
import { createContextBuilder } from "@/features/teacher/services/context-builder";
import {
  createConversationService,
  createMemoryConversationRepository,
  type ConversationRepository,
} from "@/features/teacher/services/conversation-service";
import { createExplanationService } from "@/features/teacher/services/explanation-service";
import { createKnowledgeRetriever } from "@/features/teacher/services/knowledge-retriever";
import { createPromptService } from "@/features/teacher/services/prompt-service";
import { createResponseFormatter } from "@/features/teacher/services/response-formatter";
import { createSuggestionService } from "@/features/teacher/services/suggestion-service";
import { createTeacherService } from "@/features/teacher/services/teacher-service";

export function createTeacherEngine(deps?: {
  learning?: LearningEngine;
  conversationRepo?: ConversationRepository;
  llm?: TeacherLlmProvider;
  adaptation?: AdaptationEngine | null;
  useMemory?: boolean;
  useStubLlm?: boolean;
  exportsDir?: string;
  promptsPath?: string;
  learnerId?: string;
}) {
  const learnerId = deps?.learnerId ?? DEFAULT_LEARNER_ID;
  const learning =
    deps?.learning ??
    createLearningEngine({ useMemory: deps?.useMemory ?? false });

  const conversationRepo =
    deps?.conversationRepo ??
    (deps?.useMemory
      ? createMemoryConversationRepository()
      : createFileConversationRepository({ learnerId }));

  const explanation = createExplanationService();
  const backend = resolveLiveAiBackend();
  const forceStub =
    deps?.useStubLlm === true ||
    deps?.useMemory === true ||
    backend === "none";

  const llm: TeacherLlmProvider =
    deps?.llm ??
    (forceStub
      ? createStubTeacherLlmProvider(() => "")
      : backend === "claude"
        ? createClaudeTeacherLlmProvider()
        : createOpenAiTeacherLlmProvider());

  const knowledgeRetriever = createKnowledgeRetriever({
    exportsDir: deps?.exportsDir,
  });
  const adaptation = deps?.adaptation ?? null;
  const contextBuilder = createContextBuilder(learning, {
    getAdaptation: adaptation ? () => adaptation.buildHints() : undefined,
  });
  const promptService = createPromptService({
    promptsPath: deps?.promptsPath,
  });
  const conversations = createConversationService(conversationRepo, learnerId);
  const suggestions = createSuggestionService();
  const formatter = createResponseFormatter();

  const teacher = createTeacherService({
    learning,
    contextBuilder,
    knowledgeRetriever,
    promptService,
    conversations,
    explanation,
    suggestions,
    formatter,
    llm,
  });

  return {
    learning,
    teacher,
    conversations,
    knowledgeRetriever,
    contextBuilder,
    promptService,
    explanation,
    suggestions,
    formatter,
    llm,
  };
}

export type TeacherEngine = ReturnType<typeof createTeacherEngine>;
