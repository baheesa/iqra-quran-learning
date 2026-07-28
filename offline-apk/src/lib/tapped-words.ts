/** Personal word list from mushaf taps (aligned with web `tappedWords`). */

export type TappedWordRecord = {
  id: string;
  arabic: string;
  meaning: string | null;
  tapCount: number;
  firstTappedAt: string;
  lastTappedAt: string;
  lastPage: number | null;
  lastAyahId: string | null;
};

const STORAGE_KEY = "quran.learning.tappedWords";

function normalizeKey(arabic: string): string {
  return arabic
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/gu, "")
    .replace(/\u0671/gu, "ا")
    .replace(/[آأإ]/gu, "ا")
    .replace(/ى/gu, "ي")
    .replace(/ة/gu, "ه")
    .replace(/[^\u0621-\u064A]/gu, "");
}

function readAll(): TappedWordRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as TappedWordRecord[];
  } catch {
    return [];
  }
}

function writeAll(items: TappedWordRecord[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function listTappedWords(): TappedWordRecord[] {
  return readAll().sort((a, b) => b.lastTappedAt.localeCompare(a.lastTappedAt));
}

export function recordTappedWord(input: {
  arabic: string;
  meaning: string | null;
  page?: number | null;
  ayahId?: string | null;
}): TappedWordRecord {
  const key = normalizeKey(input.arabic) || input.arabic;
  const now = new Date().toISOString();
  const existing = readAll();
  const found = existing.find((item) => item.id === key);

  const next: TappedWordRecord = found
    ? {
        ...found,
        arabic: input.arabic,
        meaning: input.meaning ?? found.meaning,
        tapCount: found.tapCount + 1,
        lastTappedAt: now,
        lastPage: input.page ?? found.lastPage,
        lastAyahId: input.ayahId ?? found.lastAyahId,
      }
    : {
        id: key,
        arabic: input.arabic,
        meaning: input.meaning,
        tapCount: 1,
        firstTappedAt: now,
        lastTappedAt: now,
        lastPage: input.page ?? null,
        lastAyahId: input.ayahId ?? null,
      };

  writeAll([next, ...existing.filter((item) => item.id !== key)]);
  return next;
}

export function removeTappedWord(id: string): void {
  writeAll(readAll().filter((item) => item.id !== id));
}

export function clearTappedWords(): void {
  localStorage.removeItem(STORAGE_KEY);
}
