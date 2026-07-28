export function loadIds(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.map(String));
  } catch {
    return new Set();
  }
}

export function saveIds(key: string, ids: Set<string>): void {
  localStorage.setItem(key, JSON.stringify([...ids]));
}

export function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveJson(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export const KEYS = {
  learnedWords: "quran.learning.learnedWordIds",
  learnedAyahs: "quran.learning.learnedAyahIds",
  memorizedDuas: "quran.learning.memorizedQuranicDuaIds",
  learnedRules: "quran.learning.learnedRuleIds",
  focusUnit: "quran.learning.focusUnit",
  readingPosition: "quran.reading.position",
  visitedPages: "quran.reading.visitedPages",
  bookmarks: "quran.reading.bookmarks",
  theme: "iqra.theme",
} as const;
