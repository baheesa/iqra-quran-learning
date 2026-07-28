import path from "path";

import { readCachedJson } from "@/lib/server/cached-json";

export type CurriculumWord = {
  id: string;
  arabic: string;
  meaning: string;
  unit: number;
  kind?: "word" | "phrase";
};

export type CurriculumUnitVocab = {
  unit: number;
  wordCount: number;
  phraseCount?: number;
  words: CurriculumWord[];
};

type UnitVocabularyFile = {
  version: number;
  totalWords: number;
  totalPhrases?: number;
  units: CurriculumUnitVocab[];
};

function unitVocabularyPath(): string {
  return path.join(
    process.cwd(),
    "data",
    "curriculum",
    "unit-vocabulary.json",
  );
}

export async function loadUnitVocabulary(): Promise<{
  totalWords: number;
  totalPhrases: number;
  units: CurriculumUnitVocab[];
}> {
  try {
    const file = await readCachedJson<UnitVocabularyFile>(unitVocabularyPath());
    return {
      totalWords: file.totalWords ?? 0,
      totalPhrases: file.totalPhrases ?? 0,
      units: file.units ?? [],
    };
  } catch {
    return { totalWords: 0, totalPhrases: 0, units: [] };
  }
}
