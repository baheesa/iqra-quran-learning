import { getCurriculumSeed } from "@/features/learning/curriculum/seed";
import {
  arabicIncludes,
  normalizeArabic,
} from "@/features/teacher/domain/arabic";

export type WordKnowledgeHit = {
  vocabularyId: string;
  arabic: string;
  urduMeaning: string;
  root: string | null;
  lessonId: string;
  lessonTitle: string | null;
  lessonObjectives: string[];
  ruleTitle: string | null;
  ruleExplanation: string | null;
  ruleExamples: string[];
  source: "muallim_approved" | "curriculum_seed";
  sourcePage: number | null;
};

/**
 * Client-safe lookup against curriculum seed.
 * Approved Muallim exports are merged via API when available.
 */
export function lookupWordInSeed(arabic: string): WordKnowledgeHit | null {
  const seed = getCurriculumSeed();
  const match = seed.vocabulary.find((item) =>
    arabicIncludes(item.arabic, arabic),
  );
  if (!match) {
    return null;
  }

  const lesson = seed.lessons.find((item) => item.id === match.lessonId);
  const rule = seed.rules.find((item) => item.lessonId === match.lessonId);

  return {
    vocabularyId: match.id,
    arabic: match.arabic,
    urduMeaning: match.urduMeaning,
    root: match.root ?? null,
    lessonId: match.lessonId,
    lessonTitle: lesson?.title ?? null,
    lessonObjectives: lesson?.objectives ?? [],
    ruleTitle: rule?.title ?? null,
    ruleExplanation: rule?.explanation ?? null,
    ruleExamples: rule?.examples ?? [],
    source: "curriculum_seed",
    sourcePage: match.sourcePage ?? null,
  };
}

export function rankSeedMatches(arabic: string): WordKnowledgeHit[] {
  const seed = getCurriculumSeed();
  const needle = normalizeArabic(arabic);
  return seed.vocabulary
    .filter((item) => {
      const target = normalizeArabic(item.arabic);
      return (
        target === needle ||
        target.includes(needle) ||
        needle.includes(target) ||
        arabicIncludes(item.arabic, arabic)
      );
    })
    .map((match) => {
      const lesson = seed.lessons.find((item) => item.id === match.lessonId);
      const rule = seed.rules.find((item) => item.lessonId === match.lessonId);
      return {
        vocabularyId: match.id,
        arabic: match.arabic,
        urduMeaning: match.urduMeaning,
        root: match.root ?? null,
        lessonId: match.lessonId,
        lessonTitle: lesson?.title ?? null,
        lessonObjectives: lesson?.objectives ?? [],
        ruleTitle: rule?.title ?? null,
        ruleExplanation: rule?.explanation ?? null,
        ruleExamples: rule?.examples ?? [],
        source: "curriculum_seed" as const,
        sourcePage: match.sourcePage ?? null,
      };
    });
}
