import {
  extractFromTxtSection,
} from "@/features/knowledge/services/txt-structure-extract";
import type {
  ExtractionInput,
  ExtractionOutput,
  ExtractionProvider,
} from "@/features/knowledge/providers/types";

/**
 * Deterministic extraction from manually transcribed TXT (txt-source OCR text).
 * Never invents meanings — only structures what the transcript already contains.
 */
export function createTxtStructureExtractionProvider(): ExtractionProvider {
  return {
    name: "txt-structure",

    async extract(input: ExtractionInput): Promise<ExtractionOutput> {
      return extractFromTxtSection(input.ocrText ?? "", {
        unitNumber: input.unitNumber,
        pageLabel: null,
        pageNumber: input.pageNumber,
      });
    },
  };
}
