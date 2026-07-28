import { getCurriculumSeed } from "@/features/learning/curriculum/seed";
import type { LearningEngine } from "@/features/learning/create-engine";
import type {
  RuleInsightItem,
  VocabInsightItem,
} from "@/features/personalization/types";

export function createStrengthAnalyzer(learning: LearningEngine) {
  return {
    strongVocabulary(limit = 8): VocabInsightItem[] {
      const seed = getCurriculumSeed();
      const progress = learning.repo.getState().vocabularyProgress;

      return [...progress]
        .filter(
          (item) =>
            (item.stage === "MASTERED" || item.stage === "UNDERSTOOD") &&
            item.confidence >= 60,
        )
        .sort(
          (a, b) =>
            b.confidence - a.confidence ||
            b.timesRecognized - a.timesRecognized,
        )
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

    mostImproved(limit = 5): VocabInsightItem[] {
      const seed = getCurriculumSeed();
      const progress = learning.repo.getState().vocabularyProgress;

      // Improvement proxy: high recognition relative to forgets + rising stage
      return [...progress]
        .filter((item) => item.timesRecognized > 0)
        .sort((a, b) => {
          const scoreA =
            a.timesRecognized * 3 - a.timesForgotten * 4 + a.confidence;
          const scoreB =
            b.timesRecognized * 3 - b.timesForgotten * 4 + b.confidence;
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

    rulesMastered(limit = 8): RuleInsightItem[] {
      const seed = getCurriculumSeed();
      const progress = learning.repo.getState().ruleProgress;

      return [...progress]
        .filter(
          (item) => item.stage === "MASTERED" || item.stage === "UNDERSTOOD",
        )
        .sort((a, b) => b.confidence - a.confidence)
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

export type StrengthAnalyzer = ReturnType<typeof createStrengthAnalyzer>;
