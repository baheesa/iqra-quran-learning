/**
 * Download Quran.com Urdu word-by-word glosses for all 604 pages.
 * Source: api.quran.com (published corpus) — not invented.
 */
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const OUT_DIR = path.join(process.cwd(), "data", "quran");
const OUT_FILE = path.join(OUT_DIR, "wbw-urdu.json");
const PAGE_COUNT = 604;
const CONCURRENCY = 8;

type WbwFile = {
  version: 1;
  source: string;
  language: "urdu";
  builtAt: string;
  wordCount: number;
  /** wordId "surah:ayah:position" → Urdu gloss */
  meanings: Record<string, string>;
};

type ApiWord = {
  position: number;
  char_type_name: string;
  translation?: { text?: string; language_name?: string } | null;
};

type ApiVerse = {
  verse_key: string;
  words: ApiWord[];
};

async function fetchPage(page: number): Promise<Record<string, string>> {
  const url = `https://api.quran.com/api/v4/verses/by_page/${page}?language=ur&words=true&word_fields=translation`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`page ${page}: HTTP ${response.status}`);
  }
  const payload = (await response.json()) as { verses: ApiVerse[] };
  const meanings: Record<string, string> = {};
  for (const verse of payload.verses ?? []) {
    const [surah, ayah] = verse.verse_key.split(":").map(Number);
    for (const word of verse.words ?? []) {
      if (word.char_type_name !== "word") continue;
      const text = word.translation?.text?.trim();
      if (!text) continue;
      // Skip ayah-end markers like (۱)
      if (/^[（(]?\d+[)）]?$/.test(text)) continue;
      const id = `${surah}:${ayah}:${word.position}`;
      meanings[id] = text;
    }
  }
  return meanings;
}

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function run() {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await worker(items[index]!);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => run()),
  );
  return results;
}

async function main() {
  const pages = Array.from({ length: PAGE_COUNT }, (_, i) => i + 1);
  console.log(`Fetching Urdu WBW for ${PAGE_COUNT} pages…`);
  const chunks = await mapPool(pages, CONCURRENCY, async (page) => {
    for (let attempt = 1; attempt <= 4; attempt += 1) {
      try {
        const part = await fetchPage(page);
        if (page % 50 === 0 || page === 1) {
          console.log(`page ${page}: ${Object.keys(part).length} words`);
        }
        return part;
      } catch (error) {
        if (attempt === 4) throw error;
        await new Promise((r) => setTimeout(r, attempt * 500));
      }
    }
    return {};
  });

  const meanings: Record<string, string> = {};
  for (const chunk of chunks) {
    Object.assign(meanings, chunk);
  }

  const file: WbwFile = {
    version: 1,
    source: "https://api.quran.com/api/v4 (language=ur, words=true)",
    language: "urdu",
    builtAt: new Date().toISOString(),
    wordCount: Object.keys(meanings).length,
    meanings,
  };

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(OUT_FILE, JSON.stringify(file), "utf8");
  console.log(
    JSON.stringify(
      {
        out: OUT_FILE,
        wordCount: file.wordCount,
        sample: {
          "1:1:1": meanings["1:1:1"],
          "1:1:2": meanings["1:1:2"],
          "1:2:1": meanings["1:2:1"],
        },
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
