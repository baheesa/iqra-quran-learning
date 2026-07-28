export type Screen =
  | "home"
  | "quran"
  | "matches"
  | "mywords"
  | "words"
  | "ayahs"
  | "rules"
  | "duas";

export type QuranPage = {
  page: number;
  juz: number;
  surahIds: number[];
  ayahs: Array<{
    id: string;
    surahId: number;
    ayahNumber: number;
    text: string;
    words: Array<{ id: string; position: number; arabic: string }>;
  }>;
};

export type SurahInfo = {
  id: number;
  nameArabic: string;
  nameEnglish: string;
  revelationType?: string;
  ayahCount?: number;
  startPage?: number;
};

export type JuzInfo = {
  juz: number;
  startPage: number;
  endPage?: number;
};

export type VocabWord = {
  id: string;
  arabic: string;
  meaning: string;
  unit: number;
};

export type CurriculumAyah = {
  id: string;
  unit: number;
  number?: number;
  arabic: string;
  meaning: string | null;
  ref?: string;
};

export type LearnerRule = {
  id: string;
  unit: number;
  title: string;
  definition?: string;
  explanation?: string;
  examples?: Array<{ arabic: string; meaning?: string | null } | string>;
};

export type Dua = {
  id: string;
  category: string;
  arabic: string;
  urdu?: string;
  occasion?: string;
  occasionUrdu?: string;
  surah?: number;
  juz?: number;
  page?: number | null;
  ref?: string;
};

export type JourneyAyah = {
  id: string;
  surahId: number;
  ayahNumber: number;
  arabic: string;
  urdu: string;
  page: number | null;
  surahNameEnglish?: string;
};
