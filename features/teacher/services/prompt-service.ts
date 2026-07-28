import {
  loadGlobalSystemPrompt,
  loadPromptSection,
} from "@/lib/prompts/load-prompts";
import type { RetrievedKnowledge } from "@/features/teacher/services/knowledge-retriever";
import type { TeacherContext, TeacherIntent } from "@/features/teacher/types";

export type TeacherBuiltPrompt = {
  system: string;
  user: string;
  promptVersion: string;
};

function intentMeta(intent: TeacherIntent): {
  section: string;
  version: string;
} {
  switch (intent) {
    case "WORD":
    case "PHRASE":
      return {
        section: "Word Recognition",
        version: "prompt-2-word-recognition@1",
      };
    case "LESSON":
      return {
        section: "Vocabulary Explanation",
        version: "prompt-3-vocabulary@1",
      };
    case "RULE":
      return { section: "Rule Explanation", version: "prompt-4-rule@1" };
    case "REVIEW_SUGGESTION":
      return { section: "Daily Review", version: "prompt-5-daily-review@1" };
    case "ASK":
    default:
      return { section: "Prompt 1 — Teacher", version: "prompt-1-teacher@1" };
  }
}

/**
 * PromptService — loads versioned prompts from cursor/PROMPTS.md only.
 */
export function createPromptService(options?: { promptsPath?: string }) {
  const promptsPath = options?.promptsPath;

  return {
    async buildTeacherPrompt(input: {
      intent: TeacherIntent;
      question: string;
      context: TeacherContext;
      knowledge: RetrievedKnowledge;
    }): Promise<TeacherBuiltPrompt> {
      const meta = intentMeta(input.intent);
      const [
        globalSystem,
        section,
        recognition,
        hallucination,
        urduStyle,
        grammarGuard,
      ] = await Promise.all([
        loadGlobalSystemPrompt(promptsPath),
        loadPromptSection(meta.section, promptsPath),
        loadPromptSection("Recognition First", promptsPath),
        loadPromptSection("Hallucination Prevention", promptsPath),
        loadPromptSection("Urdu Style Guide", promptsPath),
        loadPromptSection("Grammar Guard", promptsPath),
      ]);

      const muallimBlock = input.knowledge.hasApprovedMuallim
        ? [
            "APPROVED Muallim knowledge (source of truth when present):",
            JSON.stringify(
              {
                vocabulary: input.knowledge.vocabulary.filter(
                  (item) => item.source === "muallim_approved",
                ),
                rules: input.knowledge.rules.filter(
                  (item) => item.source === "muallim_approved",
                ),
                lessons: input.knowledge.lessons.filter(
                  (item) => item.source === "muallim_approved",
                ),
                exercises: input.knowledge.exercises,
              },
              null,
              2,
            ),
          ].join("\n")
        : "No APPROVED Muallim export is available yet. Do NOT invent book content. Clearly label any general help as عام وضاحت.";

      const seedBlock = [
        "Curriculum seed (learning context only — NOT verified Muallim pages):",
        JSON.stringify(
          {
            vocabulary: input.knowledge.vocabulary.filter(
              (item) => item.source === "curriculum_seed",
            ),
            rules: input.knowledge.rules.filter(
              (item) => item.source === "curriculum_seed",
            ),
            lessons: input.knowledge.lessons.filter(
              (item) => item.source === "curriculum_seed",
            ),
          },
          null,
          2,
        ),
      ].join("\n");

      return {
        system: [
          globalSystem,
          "",
          "You are a Muallim-style Quran teacher — NOT a chatbot.",
          "Teaching order: recognition → hint → simple Urdu explanation → encourage reading.",
          "Never begin with a full translation. Never invent Muallim content.",
          "",
          recognition,
          "",
          grammarGuard,
          "",
          hallucination,
          "",
          urduStyle,
        ].join("\n"),
        user: [
          section,
          "",
          `Intent: ${input.intent}`,
          `Question: ${input.question}`,
          "",
          "Learner context (minimum):",
          JSON.stringify(input.context, null, 2),
          "",
          muallimBlock,
          "",
          seedBlock,
          "",
          "Respond in Urdu Markdown, under 300 words.",
          "Structure: (1) recognition question or hint (2) brief explanation (3) encourage reading.",
          "If using non-Muallim info, prefix with: عام وضاحت:",
          "",
          input.context.adaptation
            ? [
                "Personalization (adapt HOW you explain — do not invent curriculum):",
                input.context.adaptation.guidanceUrdu,
                `Depth: ${input.context.adaptation.explanationDepth}`,
                `Emphasize recognition: ${input.context.adaptation.emphasizeRecognition}`,
                `Avoid overwhelm: ${input.context.adaptation.avoidOverwhelm}`,
                input.context.adaptation.reinforceWords.length
                  ? `Reinforce known words: ${input.context.adaptation.reinforceWords.join(", ")}`
                  : "",
                input.context.adaptation.mentionWeakWords.length
                  ? `Gentle review cue for: ${input.context.adaptation.mentionWeakWords.join(", ")}`
                  : "",
              ]
                .filter(Boolean)
                .join("\n")
            : "",
        ].join("\n"),
        promptVersion: meta.version,
      };
    },
  };
}

export type PromptService = ReturnType<typeof createPromptService>;
