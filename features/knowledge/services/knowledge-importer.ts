import { isOcrEnabled } from "@/features/knowledge/providers/ocr-enabled";
import type { ExtractionService } from "@/features/knowledge/services/extraction-service";
import type { OcrService } from "@/features/knowledge/services/ocr-service";
import type { FileKnowledgeRepository } from "@/features/knowledge/repository/file-repository";

type ImporterDeps = {
  repo: FileKnowledgeRepository;
  ocr: OcrService;
  extraction: ExtractionService;
};

/**
 * KnowledgeImporter — default path extracts from stored TXT source text.
 * Vision OCR runs only when OCR_ENABLED=1 (Future OCR Import).
 */
export function createKnowledgeImporter(engine: ImporterDeps) {
  return {
    async importPage(bookSlug: string, pageNumber: number) {
      const ocr = isOcrEnabled()
        ? await engine.ocr.runPage(bookSlug, pageNumber)
        : await engine.repo.getOcrResult(bookSlug, pageNumber);

      if (!ocr?.rawText) {
        throw new Error(
          `No source text for ${bookSlug} page ${pageNumber}. Import TXT first (pnpm knowledge:import).`,
        );
      }

      const extraction = await engine.extraction.extractPage(
        bookSlug,
        pageNumber,
      );
      return { ocr, extraction };
    },

    async importBook(bookSlug: string, options?: { maxPages?: number }) {
      if (isOcrEnabled()) {
        const ocr = await engine.ocr.runBook(bookSlug, options);
        const extraction = await engine.extraction.extractBook(
          bookSlug,
          options,
        );
        return { ocr, extraction };
      }

      const extraction = await engine.extraction.extractBook(bookSlug, options);
      const ocr = await engine.repo.listOcrResults(bookSlug);
      return { ocr, extraction };
    },

    async reprocessPage(bookSlug: string, pageNumber: number) {
      await engine.repo.appendLog({
        bookSlug,
        stage: "reprocess",
        message: isOcrEnabled()
          ? `Reprocessing page ${pageNumber} (OCR+extract)`
          : `Re-extracting page ${pageNumber} from TXT source (OCR skipped)`,
        level: "info",
      });
      return this.importPage(bookSlug, pageNumber);
    },
  };
}

export type KnowledgeImporter = ReturnType<typeof createKnowledgeImporter>;
