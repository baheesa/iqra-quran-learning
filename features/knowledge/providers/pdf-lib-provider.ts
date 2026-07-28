import { PDFDocument } from "pdf-lib";
import { readFile } from "fs/promises";

import type {
  PdfMetadata,
  PdfProvider,
  RenderedPage,
} from "@/features/knowledge/providers/types";

/**
 * Metadata-focused PDF provider using pdf-lib.
 * Does not rasterize pages (swap in a render-capable provider later).
 */
export function createPdfLibProvider(): PdfProvider {
  return {
    name: "pdf-lib",

    async getMetadata(pdfAbsolutePath: string): Promise<PdfMetadata> {
      const bytes = await readFile(pdfAbsolutePath);
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      return {
        pageCount: doc.getPageCount(),
        title: doc.getTitle() ?? null,
      };
    },

    async renderPages(
      pdfAbsolutePath: string,
      options?: { maxPages?: number },
    ): Promise<RenderedPage[]> {
      const metadata = await this.getMetadata(pdfAbsolutePath);
      const limit = options?.maxPages
        ? Math.min(options.maxPages, metadata.pageCount)
        : metadata.pageCount;

      const pages: RenderedPage[] = [];
      for (let pageNumber = 1; pageNumber <= limit; pageNumber += 1) {
        pages.push({
          pageNumber,
          imageBytes: null,
          width: null,
          height: null,
        });
      }
      return pages;
    },
  };
}
