import type {
  OcrInput,
  OcrOutput,
  OcrProvider,
} from "@/features/knowledge/providers/types";

/**
 * Placeholder OCR provider.
 * Returns empty text with null confidence — never invents content.
 * Replace with OpenAI Vision / Google Vision / Tesseract later.
 */
export function createStubOcrProvider(): OcrProvider {
  return {
    name: "stub-ocr",

    async recognize(input: OcrInput): Promise<OcrOutput> {
      return {
        rawText: "",
        confidence: null,
        language: null,
        boundingBoxes: [],
        provider: "stub-ocr",
      };
    },
  };
}
