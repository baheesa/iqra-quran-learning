import path from "path";

import { discoverOriginalBooks } from "@/features/knowledge/providers/book-discovery";
import type { PdfProvider } from "@/features/knowledge/providers/types";
import type { FileKnowledgeRepository } from "@/features/knowledge/repository/file-repository";
import type { BookService } from "@/features/knowledge/services/book-service";
import {
  createTxtIngestService,
  type TxtIngestService,
} from "@/features/knowledge/services/txt-ingest-service";
import type { BookManifest } from "@/features/knowledge/types";

export function createImportService(deps: {
  books: BookService;
  repo: FileKnowledgeRepository;
  pdf: PdfProvider;
  txtIngest?: TxtIngestService;
}) {
  const txtIngest = deps.txtIngest ?? createTxtIngestService(deps.repo);

  async function registerAndIngest(
    fileName: string,
    options?: { forceReimport?: boolean },
  ): Promise<BookManifest> {
    const discovered = await discoverOriginalBooks(deps.repo.dirs.original);
    const match = discovered.find((book) => book.fileName === fileName);
    if (!match) {
      throw new Error(`Book not found in original/: ${fileName}`);
    }

    let manifest = await deps.books.register(match);
    manifest = {
      ...manifest,
      sourceKind: match.sourceKind,
      updatedAt: new Date().toISOString(),
    };
    await deps.repo.saveManifest(manifest);

    if (match.sourceKind === "txt") {
      const ingested = await txtIngest.ingestBook(manifest.slug, {
        force: options?.forceReimport,
      });
      return ingested.manifest;
    }

    // Legacy PDF path — metadata only; raster/OCR stay optional (Future OCR)
    const metadata = await deps.pdf.getMetadata(match.absolutePath);
    const updated = {
      ...manifest,
      pageCount: metadata.pageCount,
      sourceKind: "pdf" as const,
      status: "REGISTERED" as const,
      updatedAt: new Date().toISOString(),
    };
    await deps.repo.saveManifest(updated);
    return updated;
  }

  return {
    async importAll(options?: {
      forceReimport?: boolean;
    }): Promise<{ imported: number; books: string[] }> {
      const discovered = await discoverOriginalBooks(deps.repo.dirs.original);
      const slugs: string[] = [];

      for (const book of discovered) {
        const manifest = await registerAndIngest(book.fileName, options);
        slugs.push(manifest.slug);
      }

      return { imported: slugs.length, books: slugs };
    },

    async importOne(fileName: string, options?: { forceReimport?: boolean }) {
      return registerAndIngest(fileName, options);
    },

    /** Re-read TXT and replace section/source-text stores (does not touch original TXT). */
    async reimportTxt(bookSlug: string) {
      return txtIngest.ingestBook(bookSlug, { force: true });
    },
  };
}

export type ImportService = ReturnType<typeof createImportService>;

void path;
