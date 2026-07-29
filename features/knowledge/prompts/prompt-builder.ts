import {
  loadGlobalSystemPrompt,
  loadPromptSection,
} from "@/lib/prompts/load-prompts";

export type BuiltPrompt = {
  system: string;
  user: string;
  promptVersion: string;
};

/**
 * Builds production prompts from config/PROMPTS.md — never hardcode prompt bodies.
 */
export function createPromptBuilder(options?: { promptsPath?: string }) {
  const promptsPath = options?.promptsPath;

  return {
    async buildOcrPrompt(input: {
      bookSlug: string;
      pageNumber: number;
    }): Promise<BuiltPrompt> {
      const [globalSystem, ocrSection] = await Promise.all([
        loadGlobalSystemPrompt(promptsPath),
        loadPromptSection("OCR Extraction", promptsPath),
      ]);

      return {
        system: [
          globalSystem,
          "",
          "You are performing OCR / vision reading of a Muallim-ul-Quran scanned page.",
          "Return JSON only. Never invent text that is not visible.",
          "If uncertain, use null / empty strings and lower confidence.",
        ].join("\n"),
        user: [
          ocrSection,
          "",
          `Book: ${input.bookSlug}`,
          `Page: ${input.pageNumber}`,
          "",
          "Respond with JSON:",
          '{ "rawText": string, "confidence": number|null, "language": string|null, "boundingBoxes": [{"x":number,"y":number,"width":number,"height":number}] }',
        ].join("\n"),
        promptVersion: "prompt-8-ocr-extraction@1",
      };
    },

    async buildExtractionPrompt(input: {
      bookSlug: string;
      pageNumber: number;
      unitNumber: number | null;
      ocrText: string;
    }): Promise<BuiltPrompt> {
      const [globalSystem, extractionSection, safety] = await Promise.all([
        loadGlobalSystemPrompt(promptsPath),
        loadPromptSection("Knowledge Extraction", promptsPath),
        loadPromptSection("Hallucination Prevention", promptsPath),
      ]);

      return {
        system: [
          globalSystem,
          "",
          "You extract structured curriculum from Muallim-ul-Quran OCR text and/or page images.",
          "Extract ONLY what exists. Never summarize, explain, or invent.",
          "If uncertain, return null for that field.",
          "",
          safety,
        ].join("\n"),
        user: [
          extractionSection,
          "",
          `Book: ${input.bookSlug}`,
          `Page: ${input.pageNumber}`,
          `Unit: ${input.unitNumber ?? "null"}`,
          "",
          "OCR text:",
          input.ocrText || "(empty)",
          "",
          "Respond with JSON only:",
          JSON.stringify(
            {
              lessons: [
                {
                  title: "string|null",
                  lessonNumber: "number|null",
                  unit: "number|null",
                  objectives: ["string"],
                  confidence: "number|null",
                },
              ],
              vocabulary: [
                {
                  arabic: "string",
                  urdu: "string|null",
                  lesson: "number|null",
                  unit: "number|null",
                  confidence: "number|null",
                },
              ],
              rules: [
                {
                  title: "string",
                  explanation: "string|null",
                  examples: ["string"],
                  lesson: "number|null",
                  unit: "number|null",
                  confidence: "number|null",
                },
              ],
              exercises: [
                {
                  question: "string",
                  answer: "string|null",
                  exerciseType: "string|null",
                  lesson: "number|null",
                  unit: "number|null",
                  difficulty: "number|null",
                  confidence: "number|null",
                },
              ],
              examples: ["string"],
              reviewQuestions: ["string"],
              headings: ["string"],
              tables: ["string"],
            },
            null,
            2,
          ),
        ].join("\n"),
        promptVersion: "prompt-10-knowledge-extraction@1",
      };
    },
  };
}

export type PromptBuilder = ReturnType<typeof createPromptBuilder>;
