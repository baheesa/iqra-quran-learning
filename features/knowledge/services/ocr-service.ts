import path from "path";

import type { OcrProvider } from "@/features/knowledge/providers/types";
import type { FileKnowledgeRepository } from "@/features/knowledge/repository/file-repository";
import type { OcrResult } from "@/features/knowledge/types";

export function createOcrService(deps: {
  repo: FileKnowledgeRepository;
  ocr: OcrProvider;
}) {
  return {
    async runPage(bookSlug: string, pageNumber: number): Promise<OcrResult> {
      const pages = await deps.repo.listPages(bookSlug);
      const page = pages.find((item) => item.pageNumber === pageNumber);
      const imageAbsolutePath = page?.imageRelativePath
        ? path.join(deps.repo.dirs.root, page.imageRelativePath)
        : null;

      const output = await deps.ocr.recognize({
        bookSlug,
        pageNumber,
        imageAbsolutePath,
      });

      const result: OcrResult = {
        bookSlug,
        pageNumber,
        provider: output.provider,
        rawText: output.rawText,
        confidence: output.confidence,
        language: output.language,
        boundingBoxes: output.boundingBoxes,
        sourceImagePath: page?.imageRelativePath ?? null,
        createdAt: new Date().toISOString(),
        version: "1",
      };

      await deps.repo.saveOcrResult(result);
      await deps.repo.appendLog({
        bookSlug,
        stage: "ocr",
        message: `OCR page ${pageNumber} via ${output.provider}`,
        level: "info",
        meta: { confidence: output.confidence },
      });

      return result;
    },

    async runBook(
      bookSlug: string,
      options?: { maxPages?: number },
    ): Promise<OcrResult[]> {
      const pages = await deps.repo.listPages(bookSlug);
      const limit = options?.maxPages ?? pages.length;
      const results: OcrResult[] = [];

      for (const page of pages.slice(0, limit)) {
        results.push(await this.runPage(bookSlug, page.pageNumber));
      }

      const manifest = await deps.repo.getManifest(bookSlug);
      if (manifest) {
        await deps.repo.saveManifest({
          ...manifest,
          status: "OCR_COMPLETE",
          updatedAt: new Date().toISOString(),
        });
      }

      return results;
    },

    list(bookSlug: string) {
      return deps.repo.listOcrResults(bookSlug);
    },
  };
}

export type OcrService = ReturnType<typeof createOcrService>;
