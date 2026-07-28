import { mkdir, readFile, readdir, writeFile, appendFile, unlink } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

import {
  knowledgePaths,
  pageImageFileName,
  pageJsonFileName,
} from "@/features/knowledge/paths";
import type {
  BookManifest,
  BookPageRecord,
  ExtractionLogEntry,
  KnowledgeExportBundle,
  OcrResult,
  PageExtraction,
  VerificationRecord,
} from "@/features/knowledge/types";

export type KnowledgeDirs = {
  root: string;
  original: string;
  processed: string;
  pages: string;
  ocr: string;
  extracted: string;
  verified: string;
  exports: string;
  logs: string;
};

function dirsFromRoot(root: string): KnowledgeDirs {
  return {
    root,
    original: path.join(root, "original"),
    processed: path.join(root, "processed"),
    pages: path.join(root, "pages"),
    ocr: path.join(root, "ocr"),
    extracted: path.join(root, "extracted"),
    verified: path.join(root, "verified"),
    exports: path.join(root, "exports"),
    logs: path.join(root, "logs"),
  };
}

async function ensureDir(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true });
}

async function readJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function writeJsonFile(filePath: string, data: unknown): Promise<void> {
  await ensureDir(path.dirname(filePath));
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

export function createFileKnowledgeRepository(
  root: string = knowledgePaths.root,
) {
  const dirs = dirsFromRoot(root);

  return {
    dirs,

    async saveManifest(manifest: BookManifest): Promise<void> {
      const dir = path.join(dirs.processed, manifest.slug);
      await ensureDir(dir);
      await writeJsonFile(path.join(dir, "manifest.json"), manifest);
    },

    async getManifest(bookSlug: string): Promise<BookManifest | null> {
      return readJsonFile<BookManifest>(
        path.join(dirs.processed, bookSlug, "manifest.json"),
      );
    },

    async listManifests(): Promise<BookManifest[]> {
      await ensureDir(dirs.processed);
      const entries = await readdir(dirs.processed, { withFileTypes: true });
      const manifests: BookManifest[] = [];

      for (const entry of entries) {
        if (!entry.isDirectory()) {
          continue;
        }
        const manifest = await this.getManifest(entry.name);
        if (manifest) {
          manifests.push(manifest);
        }
      }

      return manifests.sort((a, b) => {
        const unitA = a.unitNumber ?? Number.MAX_SAFE_INTEGER;
        const unitB = b.unitNumber ?? Number.MAX_SAFE_INTEGER;
        return unitA - unitB;
      });
    },

    async savePages(bookSlug: string, pages: BookPageRecord[]): Promise<void> {
      const dir = path.join(dirs.pages, bookSlug);
      await ensureDir(dir);
      await writeJsonFile(path.join(dir, "index.json"), pages);

      for (const page of pages) {
        await writeJsonFile(
          path.join(dir, pageJsonFileName(page.pageNumber)),
          page,
        );
      }
    },

    async listPages(bookSlug: string): Promise<BookPageRecord[]> {
      return (
        (await readJsonFile<BookPageRecord[]>(
          path.join(dirs.pages, bookSlug, "index.json"),
        )) ?? []
      );
    },

    async savePageImage(
      bookSlug: string,
      pageNumber: number,
      bytes: Uint8Array,
    ): Promise<string> {
      const dir = path.join(dirs.pages, bookSlug);
      await ensureDir(dir);
      const fileName = pageImageFileName(pageNumber);
      await writeFile(path.join(dir, fileName), bytes);
      return path.join("pages", bookSlug, fileName);
    },

    async saveOcrResult(result: OcrResult): Promise<void> {
      const dir = path.join(dirs.ocr, result.bookSlug);
      await ensureDir(dir);
      await writeJsonFile(
        path.join(dir, pageJsonFileName(result.pageNumber)),
        result,
      );
    },

    async getOcrResult(
      bookSlug: string,
      pageNumber: number,
    ): Promise<OcrResult | null> {
      return readJsonFile<OcrResult>(
        path.join(dirs.ocr, bookSlug, pageJsonFileName(pageNumber)),
      );
    },

    async listOcrResults(bookSlug: string): Promise<OcrResult[]> {
      await ensureDir(path.join(dirs.ocr, bookSlug));
      const files = await readdir(path.join(dirs.ocr, bookSlug));
      const results: OcrResult[] = [];
      for (const file of files) {
        if (!file.endsWith(".json")) {
          continue;
        }
        const result = await readJsonFile<OcrResult>(
          path.join(dirs.ocr, bookSlug, file),
        );
        if (result) {
          results.push(result);
        }
      }
      return results.sort((a, b) => a.pageNumber - b.pageNumber);
    },

    /**
     * Remove OCR/extracted page JSON beyond the current page count.
     * Prevents stale OCR-era pages from polluting approve/export after TXT re-ingest.
     */
    async clearStaleArtifacts(
      bookSlug: string,
      pageCount: number,
    ): Promise<{ removedOcr: number; removedExtracted: number }> {
      let removedOcr = 0;
      let removedExtracted = 0;

      for (const [dir, counter] of [
        [path.join(dirs.ocr, bookSlug), "ocr"],
        [path.join(dirs.extracted, bookSlug), "extracted"],
      ] as const) {
        try {
          const files = await readdir(dir);
          for (const file of files) {
            const match = file.match(/^page-(\d+)\.json$/);
            if (!match) continue;
            const n = Number(match[1]);
            if (n > pageCount) {
              await unlink(path.join(dir, file));
              if (counter === "ocr") removedOcr += 1;
              else removedExtracted += 1;
            }
          }
        } catch {
          // directory may not exist yet
        }
      }

      return { removedOcr, removedExtracted };
    },

    async saveExtraction(extraction: PageExtraction): Promise<void> {
      const dir = path.join(dirs.extracted, extraction.bookSlug);
      await ensureDir(dir);
      await writeJsonFile(
        path.join(dir, pageJsonFileName(extraction.pageNumber)),
        extraction,
      );
    },

    async getExtraction(
      bookSlug: string,
      pageNumber: number,
    ): Promise<PageExtraction | null> {
      return readJsonFile<PageExtraction>(
        path.join(dirs.extracted, bookSlug, pageJsonFileName(pageNumber)),
      );
    },

    async listExtracted(bookSlug: string): Promise<PageExtraction[]> {
      await ensureDir(path.join(dirs.extracted, bookSlug));
      const files = await readdir(path.join(dirs.extracted, bookSlug));
      const items: PageExtraction[] = [];
      for (const file of files) {
        if (!file.endsWith(".json")) {
          continue;
        }
        const item = await readJsonFile<PageExtraction>(
          path.join(dirs.extracted, bookSlug, file),
        );
        if (item) {
          items.push(item);
        }
      }
      return items.sort((a, b) => a.pageNumber - b.pageNumber);
    },

    async saveVerification(record: VerificationRecord): Promise<void> {
      const dir = path.join(dirs.verified, record.bookSlug);
      await ensureDir(dir);
      await writeJsonFile(path.join(dir, `${record.id}.json`), record);

      const indexPath = path.join(dir, "index.json");
      const existing =
        (await readJsonFile<VerificationRecord[]>(indexPath)) ?? [];
      const next = [
        record,
        ...existing.filter((item) => item.id !== record.id),
      ];
      await writeJsonFile(indexPath, next);
    },

    async listVerifications(bookSlug: string): Promise<VerificationRecord[]> {
      return (
        (await readJsonFile<VerificationRecord[]>(
          path.join(dirs.verified, bookSlug, "index.json"),
        )) ?? []
      );
    },

    async appendLog(
      entry: Omit<ExtractionLogEntry, "id" | "createdAt"> & {
        id?: string;
        createdAt?: string;
      },
    ): Promise<ExtractionLogEntry> {
      await ensureDir(dirs.logs);
      const full: ExtractionLogEntry = {
        id: entry.id ?? randomUUID(),
        bookSlug: entry.bookSlug,
        stage: entry.stage,
        message: entry.message,
        level: entry.level,
        createdAt: entry.createdAt ?? new Date().toISOString(),
        ...(entry.meta ? { meta: entry.meta } : {}),
      };

      await appendFile(
        path.join(dirs.logs, `${entry.bookSlug || "system"}.jsonl`),
        `${JSON.stringify(full)}\n`,
        "utf8",
      );
      return full;
    },

    async saveExportBundle(bundle: KnowledgeExportBundle): Promise<void> {
      const dir = path.join(dirs.exports, bundle.bookSlug);
      await ensureDir(dir);
      await writeJsonFile(path.join(dir, "lessons.json"), bundle.lessons);
      await writeJsonFile(path.join(dir, "vocabulary.json"), bundle.vocabulary);
      await writeJsonFile(path.join(dir, "rules.json"), bundle.rules);
      await writeJsonFile(path.join(dir, "exercises.json"), bundle.exercises);
      await writeJsonFile(path.join(dir, "bundle.json"), bundle);
    },

    async getExportBundle(
      bookSlug: string,
    ): Promise<KnowledgeExportBundle | null> {
      return readJsonFile<KnowledgeExportBundle>(
        path.join(dirs.exports, bookSlug, "bundle.json"),
      );
    },
  };
}

export type FileKnowledgeRepository = ReturnType<
  typeof createFileKnowledgeRepository
>;
