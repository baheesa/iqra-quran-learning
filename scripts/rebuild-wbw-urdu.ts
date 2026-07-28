/**
 * Build Urdu word-by-word meanings from ONE published source (quranwbw.com Urdu).
 * Aligns to local mushaf word ids, accounting for:
 * - Bismillah prepended on ayah 1 (all surahs except 1 and 9)
 * - Pause marks / punctuation tokens in the mushaf that have no WBW gloss
 *
 * Does not use Muallim TXT for mushaf meanings.
 */
import { mkdir, readdir, readFile, writeFile } from "fs/promises";
import path from "path";

const OUT_FILE = path.join(process.cwd(), "data", "quran", "wbw-urdu.json");
const UR_URL =
  "https://static.quranwbw.com/data/v4/words-data/translations/2.json";

type ChapterFile = Record<string, Record<string, string[][]>>;

const BISMILLAH_URDU = [
  "اللہ کے نام سے",
  "اللہ کے",
  "بے حد مہربان",
  "نہایت رحم والا",
];

function stripForMatch(arabic: string): string {
  return arabic
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/gu, "")
    .replace(/\u0671/gu, "ا") // ٱ → ا
    .replace(/[آأإ]/gu, "ا");
}

function isPunctuationToken(arabic: string): boolean {
  const t = arabic.trim();
  if (!t) return true;
  // Quran pause / ornament marks, isolated punctuation
  if (/^[\u06D6-\u06ED\u0640ۣۖۗۘۙۚۛۜ۟۠ۡۢۤۥۦۧۨ۩۪ۭ۫۬\-–—….,:;!?﴾﴿]+$/u.test(t)) {
    return true;
  }
  // No Arabic letter → not a glossable word
  if (!/[\u0621-\u064A\u066E\u066F\u0671-\u06D3]/u.test(t)) return true;
  return false;
}

function startsWithBismillah(
  words: Array<{ arabic: string }>,
): boolean {
  const content = words
    .filter((w) => !isPunctuationToken(w.arabic))
    .slice(0, 4)
    .map((w) => stripForMatch(w.arabic));
  if (content.length < 4) return false;
  const first = content[0]!;
  const second = content[1]!;
  return /بسم/u.test(first) && /الل/u.test(second);
}

async function fetchUrdu(): Promise<ChapterFile> {
  const res = await fetch(UR_URL, {
    headers: { "User-Agent": "Mozilla/5.0 quran-learning-app" },
  });
  if (!res.ok) throw new Error(`WBW fetch failed: ${res.status}`);
  return (await res.json()) as ChapterFile;
}

async function main() {
  console.log("Fetching single-source Urdu WBW (quranwbw)…");
  const ur = await fetchUrdu();

  // Natural Urdu for the standard Bismillah (same sense as source 1:1, without mechanical calque)
  const bismillah = BISMILLAH_URDU;

  const meanings: Record<string, string> = {};
  let aligned = 0;
  let skippedPunct = 0;
  let bismillahWords = 0;

  const dir = path.join(process.cwd(), "data", "quran", "by-page");
  const files = (await readdir(dir))
    .filter((f) => f.endsWith(".json"))
    .sort((a, b) => Number(a.replace(".json", "")) - Number(b.replace(".json", "")));

  for (const file of files) {
    const page = JSON.parse(await readFile(path.join(dir, file), "utf8")) as {
      ayahs: Array<{
        surahId: number;
        ayahNumber: number;
        words: Array<{ id: string; arabic: string; position: number }>;
      }>;
    };

    for (const ayah of page.ayahs ?? []) {
      const surah = ayah.surahId;
      const ayahNo = ayah.ayahNumber;
      const wbwList = ur[String(surah)]?.[String(ayahNo)]?.[0] ?? [];
      const hasBisPrefix =
        surah !== 1 &&
        surah !== 9 &&
        ayahNo === 1 &&
        startsWithBismillah(ayah.words);

      let wbwIndex = 0;
      let bisIndex = 0;

      for (const word of ayah.words) {
        if (isPunctuationToken(word.arabic)) {
          skippedPunct += 1;
          continue;
        }

        if (hasBisPrefix && bisIndex < 4) {
          meanings[word.id] = bismillah[bisIndex]!;
          bisIndex += 1;
          bismillahWords += 1;
          aligned += 1;
          continue;
        }

        // Fatiha 1:1 is Bismillah itself — use the same natural four glosses
        if (surah === 1 && ayahNo === 1 && (word.position ?? wbwIndex + 1) <= 4) {
          const pos = (word.position ?? wbwIndex + 1) - 1;
          if (pos >= 0 && pos < 4) {
            meanings[word.id] = bismillah[pos]!;
            aligned += 1;
            wbwIndex += 1;
            continue;
          }
        }

        const gloss = wbwList[wbwIndex]?.trim();
        wbwIndex += 1;
        if (!gloss) continue;
        let meaning = gloss;
        if (/^ساتھ\s+نام$/u.test(meaning)) meaning = "اللہ کے نام سے";
        if (/^دکھا\s+ہم\s+کو$/u.test(meaning)) meaning = "ہمیں ہدایت دے";
        meanings[word.id] = meaning;
        aligned += 1;
      }
    }
  }

  const out = {
    version: 4,
    source: "quranwbw.com Urdu WBW only — aligned to mushaf (Bismillah + punctuation)",
    language: "urdu" as const,
    builtAt: new Date().toISOString(),
    wordCount: Object.keys(meanings).length,
    meanings,
  };

  await mkdir(path.dirname(OUT_FILE), { recursive: true });
  await writeFile(OUT_FILE, JSON.stringify(out), "utf8");

  console.log(
    JSON.stringify(
      {
        wordCount: out.wordCount,
        aligned,
        skippedPunct,
        bismillahWords,
        sample: {
          "1:1:1": meanings["1:1:1"],
          "8:1:1": meanings["8:1:1"],
          "8:1:5": meanings["8:1:5"],
          "8:1:6": meanings["8:1:6"],
          "8:1:9": meanings["8:1:9"],
          "9:1:1": meanings["9:1:1"],
          "2:1:1": meanings["2:1:1"],
          "2:1:5": meanings["2:1:5"],
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
