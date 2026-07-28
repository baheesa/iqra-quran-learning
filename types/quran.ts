export type QuranWordData = {
  id: string;
  position: number;
  arabic: string;
};

export type QuranAyahData = {
  id: string;
  surahId: number;
  ayahNumber: number;
  globalNumber: number;
  juz: number;
  page: number;
  text: string;
  words: QuranWordData[];
};

export type QuranPageData = {
  page: number;
  juz: number;
  surahIds: number[];
  ayahs: QuranAyahData[];
};

export type SurahInfo = {
  id: number;
  nameArabic: string;
  nameEnglish: string;
  nameTranslation: string;
  ayahCount: number;
  revelationType: string;
  startPage: number;
  startJuz: number;
};

export type JuzInfo = {
  juz: number;
  startPage: number;
};

export type QuranMeta = {
  source: string;
  pageCount: number;
  surahCount: number;
  ayahCount: number;
  wordSplit: string;
  note: string;
};

export type ReadingPosition = {
  page: number;
  juz: number;
  surahId: number;
  ayahNumber: number;
  updatedAt: string;
};

export type ReadingHistoryEntry = {
  id: string;
  page: number;
  juz: number;
  surahId: number;
  ayahNumber: number;
  visitedAt: string;
};

export type BookmarkRecord = {
  id: string;
  page: number;
  juz: number;
  surahId: number;
  ayahNumber: number;
  title: string;
  note?: string;
  createdAt: string;
};

export type SelectedWordInfo = {
  id: string;
  arabic: string;
  position: number;
  surahId: number;
  ayahNumber: number;
  page: number;
  juz: number;
  ayahId: string;
};
