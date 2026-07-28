export const STORAGE_KEYS = {
  readingPosition: "quran.reading.position",
  readingHistory: "quran.reading.history",
  /** Unique mushaf pages ever opened — used for journey %, not capped like history. */
  visitedPages: "quran.reading.visitedPages",
  bookmarks: "quran.reading.bookmarks",
  tappedWords: "quran.learning.tappedWords",
} as const;

export const QURAN_PAGE_COUNT = 604;
export const QURAN_JUZ_COUNT = 30;
export const QURAN_SURAH_COUNT = 114;

export const MAX_READING_HISTORY = 50;
