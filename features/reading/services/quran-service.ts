import { readFile } from "fs/promises";
import path from "path";

import { createJsonLruCache, readCachedJson } from "@/lib/server/cached-json";
import type {
  JuzInfo,
  QuranMeta,
  QuranPageData,
  SurahInfo,
} from "@/types/quran";

const DATA_DIR = path.join(process.cwd(), "data", "quran");

/** Keep only a few recent mushaf pages parsed in RAM (not all 604). */
const pageCache = createJsonLruCache<QuranPageData>(12);

export async function getQuranMeta(): Promise<QuranMeta> {
  return readCachedJson<QuranMeta>(path.join(DATA_DIR, "meta.json"));
}

export async function getSurahs(): Promise<SurahInfo[]> {
  return readCachedJson<SurahInfo[]>(path.join(DATA_DIR, "surahs.json"));
}

export async function getJuzIndex(): Promise<JuzInfo[]> {
  return readCachedJson<JuzInfo[]>(path.join(DATA_DIR, "juz-index.json"));
}

export async function getQuranPage(page: number): Promise<QuranPageData> {
  if (!Number.isInteger(page) || page < 1 || page > 604) {
    throw new Error(`Invalid Quran page: ${page}`);
  }

  const key = String(page);
  const cached = pageCache.get(key);
  if (cached) return cached;

  const fullPath = path.join(DATA_DIR, "by-page", `${page}.json`);
  const raw = await readFile(fullPath, "utf8");
  const data = JSON.parse(raw) as QuranPageData;
  pageCache.set(key, data);
  return data;
}

export function getSurahOnPage(
  page: QuranPageData,
  surahs: SurahInfo[],
): SurahInfo[] {
  return page.surahIds
    .map((id) => surahs.find((surah) => surah.id === id))
    .filter((surah): surah is SurahInfo => surah !== undefined);
}
