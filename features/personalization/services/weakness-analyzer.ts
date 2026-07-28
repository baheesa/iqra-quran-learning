import { getCurriculumSeed } from "@/features/learning/curriculum/seed";
import type { LearningEngine } from "@/features/learning/create-engine";
import type { VocabInsightItem } from "@/features/personalization/types";

export function createWeaknessAnalyzer(learning: LearningEngine) {
  return {
    analyzeVocabulary(limit = 8): VocabInsightItem[] {
      const seed = getCurriculumSeed();
      const progress = learning.repo.getState().vocabularyProgress;

      return [...progress]
        .filter(
          (item) =>
            item.stage === "NEEDS_REVIEW" ||
            item.timesForgotten > 0 ||
            item.confidence < 45,
        )
        .sort((a, b) => {
          const scoreA =
            a.timesForgotten * 10 +
            (100 - a.confidence) +
            (a.stage === "NEEDS_REVIEW" ? 20 : 0);
          const scoreB =
            b.timesForgotten * 10 +
            (100 - b.confidence) +
            (b.stage === "NEEDS_REVIEW" ? 20 : 0);
          return scoreB - scoreA;
        })
        .slice(0, limit)
        .map((item) => {
          const vocab = seed.vocabulary.find((v) => v.id === item.vocabularyId);
          return {
            id: item.vocabularyId,
            arabic: vocab?.arabic ?? item.vocabularyId,
            urduMeaning: vocab?.urduMeaning ?? "",
            confidence: item.confidence,
            stage: item.stage,
            timesForgotten: item.timesForgotten,
          };
        });
    },

    analyzeRules(limit = 5) {
      const seed = getCurriculumSeed();
      const progress = learning.repo.getState().ruleProgress;

      return [...progress]
        .filter(
          (item) =>
            item.stage === "NEEDS_REVIEW" ||
            item.mistakes > 0 ||
            item.confidence < 50,
        )
        .sort(
          (a, b) =>
            b.mistakes * 5 +
            (100 - b.confidence) -
            (a.mistakes * 5 + (100 - a.confidence)),
        )
        .slice(0, limit)
        .map((item) => {
          const rule = seed.rules.find((r) => r.id === item.ruleId);
          return {
            id: item.ruleId,
            title: rule?.title ?? item.ruleId,
            lessonId: rule?.lessonId ?? "",
            confidence: item.confidence,
            stage: item.stage,
            mistakes: item.mistakes,
          };
        });
    },
  };
}

export type WeaknessAnalyzer = ReturnType<typeof createWeaknessAnalyzer>;
