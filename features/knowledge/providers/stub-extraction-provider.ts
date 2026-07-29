import type {
  ExtractionInput,
  ExtractionOutput,
  ExtractionProvider,
} from "@/features/knowledge/providers/types";

/**
 * Placeholder extraction provider.
 * Returns empty structured arrays — never invents lessons/vocabulary/rules.
 * Wire Prompt 8 / Prompt 10 from config/PROMPTS.md when AI is connected.
 */
export function createStubExtractionProvider(): ExtractionProvider {
  return {
    name: "stub-extraction",

    async extract(_input: ExtractionInput): Promise<ExtractionOutput> {
      return {
        provider: "stub-extraction",
        lessons: [],
        vocabulary: [],
        rules: [],
        exercises: [],
        examples: [],
        reviewQuestions: [],
        headings: [],
        tables: [],
      };
    },
  };
}
