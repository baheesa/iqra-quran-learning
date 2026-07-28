import { readFile } from "fs/promises";
import path from "path";

import type { FileKnowledgeRepository } from "@/features/knowledge/repository/file-repository";
import { parseTxtIntoSections } from "@/features/knowledge/services/txt-parser";
import type {
  BookManifest,
  BookPageRecord,
  OcrResult,
} from "@/features/knowledge/types";

export const TXT_SOURCE_PROVIDER = "txt-source";

export type TxtIngestResult = {
  manifest: BookManifest;
  sectionCount: number;
  characterCount: number;
  hasPageMarkers: boolean;
  reimported: boolean;
};

/**
 * Ingest an immutable TXT original into pages/ + ocr/ (as source text).
 * Never modifies the TXT file. Never calls Vision OCR.
 */
export function createTxtIngestService(repo: FileKnowledgeRepository) {
  return {
    async ingestBook(
      bookSlug: string,
      options?: { force?: boolean },
    ): Promise<TxtIngestResult> {
      const manifest = await repo.getManifest(bookSlug);
      if (!manifest) {
        throw new Error(`Unknown book: ${bookSlug}`);
      }

      if (!manifest.originalFileName.toLowerCase().endsWith(".txt")) {
        throw new Error(
          `TXT ingest requires a .txt original (got ${manifest.originalFileName})`,
        );
      }

      const absolute = path.join(repo.dirs.original, manifest.originalFileName);
      const raw = await readFile(absolute, "utf8");
      const parsed = parseTxtIntoSections(raw);

      const existingOcr = await repo.listOcrResults(bookSlug);
      const alreadyIngested =
        existingOcr.length > 0 &&
        existingOcr.every((item) => item.provider === TXT_SOURCE_PROVIDER);

      if (
        alreadyIngested &&
        !options?.force &&
        existingOcr.length === parsed.sections.length &&
        manifest.sourceChecksum === manifest.checksum
      ) {
        return {
          manifest,
          sectionCount: parsed.sections.length,
          characterCount: parsed.characterCount,
          hasPageMarkers: parsed.hasPageMarkers,
          reimported: false,
        };
      }

      const now = new Date().toISOString();
      const pages: BookPageRecord[] = parsed.sections.map((section) => ({
        bookId: manifest.id,
        bookSlug,
        pageNumber: section.sectionNumber,
        imageRelativePath: null,
        width: null,
        height: null,
        status: "PENDING",
        updatedAt: now,
      }));

      await repo.savePages(bookSlug, pages);

      for (const section of parsed.sections) {
        const result: OcrResult = {
          bookSlug,
          pageNumber: section.sectionNumber,
          provider: TXT_SOURCE_PROVIDER,
          rawText: section.text,
          confidence: 1,
          language: null,
          boundingBoxes: [],
          sourceImagePath: null,
          createdAt: now,
          version: "1",
          reviewStatus: "ACCEPTED",
        };
        await repo.saveOcrResult(result);
      }

      await repo.clearStaleArtifacts(bookSlug, parsed.sections.length);

      const updated: BookManifest = {
        ...manifest,
        pageCount: parsed.sections.length,
        characterCount: parsed.characterCount,
        sectionCount: parsed.sections.length,
        sourceKind: "txt",
        sourceChecksum: manifest.checksum,
        status: "OCR_COMPLETE",
        updatedAt: now,
      };
      await repo.saveManifest(updated);
      await repo.appendLog({
        bookSlug,
        stage: "txt-ingest",
        message: `Ingested TXT into ${parsed.sections.length} section(s)`,
        level: "info",
        meta: {
          characterCount: parsed.characterCount,
          hasPageMarkers: parsed.hasPageMarkers,
          force: Boolean(options?.force),
        },
      });

      return {
        manifest: updated,
        sectionCount: parsed.sections.length,
        characterCount: parsed.characterCount,
        hasPageMarkers: parsed.hasPageMarkers,
        reimported: Boolean(options?.force) || alreadyIngested,
      };
    },
  };
}

export type TxtIngestService = ReturnType<typeof createTxtIngestService>;
