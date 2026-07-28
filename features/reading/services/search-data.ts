import path from "path";

import { readCachedJson } from "@/lib/server/cached-json";
import type { AyahCard, SearchHit } from "@/features/reading/lib/quran-search";

const DATA_DIR = path.join(process.cwd(), "data", "quran");

type SearchIndexFile = {
  forms?: Record<string, SearchHit[]>;
};

type AyahCardsFile = {
  ayahs?: Record<string, AyahCard>;
};

export async function getWordSearchIndex(): Promise<
  Record<string, SearchHit[]>
> {
  const data = await readCachedJson<SearchIndexFile>(
    path.join(DATA_DIR, "word-search-index.json"),
  );
  return data.forms ?? {};
}

export async function getAyahCards(): Promise<Record<string, AyahCard>> {
  const data = await readCachedJson<AyahCardsFile>(
    path.join(DATA_DIR, "ayah-cards.json"),
  );
  return data.ayahs ?? {};
}
