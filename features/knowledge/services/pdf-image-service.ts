import path from "path";

import type { PdfProvider } from "@/features/knowledge/providers/types";
import type { FileKnowledgeRepository } from "@/features/knowledge/repository/file-repository";
import type { BookPageRecord } from "@/features/knowledge/types";

export function createPdfService(deps: {
  repo: FileKnowledgeRepository;
  pdf: PdfProvider;
}) {
  return {
    async getPageCount(bookSlug: string): Promise<number> {
      const manifest = await deps.repo.getManifest(bookSlug);
      if (!manifest) {
        throw new Error(`Unknown book: ${bookSlug}`);
      }
      const absolute = path.join(
        deps.repo.dirs.original,
        manifest.originalFileName,
      );
      const metadata = await deps.pdf.getMetadata(absolute);
      return metadata.pageCount;
    },
  };
}

export function createImageService(deps: {
  repo: FileKnowledgeRepository;
  pdf: PdfProvider;
}) {
  return {
    async extractPages(
      bookSlug: string,
      options?: { maxPages?: number },
    ): Promise<BookPageRecord[]> {
      const manifest = await deps.repo.getManifest(bookSlug);
      if (!manifest) {
        throw new Error(`Unknown book: ${bookSlug}`);
      }

      const absolute = path.join(
        deps.repo.dirs.original,
        manifest.originalFileName,
      );
      const rendered = await deps.pdf.renderPages(absolute, options);
      const now = new Date().toISOString();
      const pages: BookPageRecord[] = [];

      for (const page of rendered) {
        let imageRelativePath: string | null = null;
        let status: BookPageRecord["status"] = "PENDING";

        if (page.imageBytes) {
          imageRelativePath = await deps.repo.savePageImage(
            bookSlug,
            page.pageNumber,
            page.imageBytes,
          );
          status = "RENDERED";
        }

        pages.push({
          bookId: manifest.id,
          bookSlug,
          pageNumber: page.pageNumber,
          imageRelativePath,
          width: page.width,
          height: page.height,
          status,
          updatedAt: now,
        });
      }

      await deps.repo.savePages(bookSlug, pages);
      await deps.repo.saveManifest({
        ...manifest,
        pageCount: pages.length,
        status: "PAGES_EXTRACTED",
        updatedAt: now,
      });
      await deps.repo.appendLog({
        bookSlug,
        stage: "pages",
        message: `Registered ${pages.length} pages via ${deps.pdf.name}`,
        level: "info",
      });

      return pages;
    },
  };
}

export type PdfService = ReturnType<typeof createPdfService>;
export type ImageService = ReturnType<typeof createImageService>;
