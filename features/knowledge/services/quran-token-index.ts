import { mkdir, readFile, readdir, writeFile } from "fs/promises";
import path from "path";

import {
  arabicLookupCandidates,
  normalizeArabic,
} from "@/features/teacher/domain/arabic";
import type { QuranPageData } from "@/types/quran";

export type QuranTokenIndexEntry = {
  /** Preferred display surface (first seen). */
  arabic: string;
  occurrences: number;
  /** Sample locations as "surah:ayah" — factual from Quran JSON only. */
  references: string[];
};

export type QuranTokenIndexFile = {
  version: 1;
  builtAt: string;
  tokenCount: number;
  occurrenceCount: number;
  /** Normalized key → token stats */
  entries: Record<string, QuranTokenIndexEntry>;
};

const QURAN_DATA_DIR = path.join(process.cwd(), "data", "quran");
const TOKEN_INDEX_FILE = "token-index.json";

let memoryTokenIndex: QuranTokenIndexFile | null = null;

export function quranTokenIndexPath(
  quranDir = QURAN_DATA_DIR,
): string {
  return path.join(quranDir, TOKEN_INDEX_FILE);
}

export function clearQuranTokenIndexCache(): void {
  memoryTokenIndex = null;
}

/**
 * Build an index of every unique Quran surface form from by-page JSON.
 * No meanings are invented — only tokens + occurrence refs.
 */
export async function rebuildQuranTokenIndex(
  quranDir = QURAN_DATA_DIR,
): Promise<QuranTokenIndexFile> {
  const byPageDir = path.join(quranDir, "by-page");
  const files = (await readdir(byPageDir))
    .filter((name) => name.endsWith(".json"))
    .sort(
      (a, b) =>
        Number(a.replace(/\.json$/, "")) - Number(b.replace(/\.json$/, "")),
    );

  const entries: Record<string, QuranTokenIndexEntry> = {};
  let occurrenceCount = 0;

  for (const file of files) {
    const page = JSON.parse(
      await readFile(path.join(byPageDir, file), "utf8"),
    ) as QuranPageData;

    for (const ayah of page.ayahs) {
      const ref = `${ayah.surahId}:${ayah.ayahNumber}`;
      for (const word of ayah.words) {
        const key = normalizeArabic(word.arabic);
        if (!key) continue;
        occurrenceCount += 1;
        const existing = entries[key];
        if (!existing) {
          entries[key] = {
            arabic: word.arabic,
            occurrences: 1,
            references: [ref],
          };
          continue;
        }
        existing.occurrences += 1;
        if (
          existing.references.length < 8 &&
          !existing.references.includes(ref)
        ) {
          existing.references.push(ref);
        }
      }
    }
  }

  const index: QuranTokenIndexFile = {
    version: 1,
    builtAt: new Date().toISOString(),
    tokenCount: Object.keys(entries).length,
    occurrenceCount,
    entries,
  };

  await mkdir(quranDir, { recursive: true });
  await writeFile(quranTokenIndexPath(quranDir), JSON.stringify(index), "utf8");
  memoryTokenIndex = index;
  return index;
}

export async function loadQuranTokenIndex(
  quranDir = QURAN_DATA_DIR,
): Promise<QuranTokenIndexFile> {
  if (memoryTokenIndex) return memoryTokenIndex;
  try {
    const raw = await readFile(quranTokenIndexPath(quranDir), "utf8");
    memoryTokenIndex = JSON.parse(raw) as QuranTokenIndexFile;
    return memoryTokenIndex;
  } catch {
    return rebuildQuranTokenIndex(quranDir);
  }
}

export function lookupQuranToken(
  index: QuranTokenIndexFile,
  word: string,
): QuranTokenIndexEntry | null {
  for (const key of arabicLookupCandidates(word)) {
    const hit = index.entries[key];
    if (hit) return hit;
  }
  return null;
}
