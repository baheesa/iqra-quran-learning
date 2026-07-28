import { getCurriculumSeed } from "@/features/learning/curriculum/seed";
import type { LearningEngine } from "@/features/learning/create-engine";
import type { PersonalizationPrefsStore } from "@/features/personalization/repository/prefs-store";
import type { StrengthAnalyzer } from "@/features/personalization/services/strength-analyzer";
import type { WeaknessAnalyzer } from "@/features/personalization/services/weakness-analyzer";
import type {
  ConfidenceTrend,
  ExplanationStyle,
  LearnerProfileView,
} from "@/features/personalization/types";

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
}

function confidenceTrend(
  progress: Array<{ confidence: number; updatedAt: string; createdAt: string }>,
): ConfidenceTrend {
  if (progress.length < 2) return "stable";
  const sorted = [...progress].sort((a, b) =>
    a.updatedAt.localeCompare(b.updatedAt),
  );
  const mid = Math.floor(sorted.length / 2);
  const older = average(sorted.slice(0, mid).map((item) => item.confidence));
  const newer = average(sorted.slice(mid).map((item) => item.confidence));
  if (newer - older >= 8) return "rising";
  if (older - newer >= 8) return "falling";
  return "stable";
}

export function createLearnerProfileService(deps: {
  learning: LearningEngine;
  prefs: PersonalizationPrefsStore;
  weakness: WeaknessAnalyzer;
  strength: StrengthAnalyzer;
}) {
  return {
    getPreferences() {
      return deps.prefs.get();
    },

    setExplanationStyle(style: ExplanationStyle) {
      return deps.prefs.set(style);
    },

    buildProfile(): LearnerProfileView {
      const state = deps.learning.repo.getState();
      const seed = getCurriculumSeed();
      const lesson =
        seed.lessons.find(
          (item) => item.id === state.profile.currentLessonId,
        ) ?? null;

      const sessions = state.sessions.filter(
        (item) => item.status === "COMPLETED" || item.elapsedSeconds > 0,
      );
      const averageSessionMinutes =
        sessions.length === 0
          ? 0
          : Math.round(
              sessions.reduce((sum, item) => sum + item.elapsedSeconds, 0) /
                sessions.length /
                60,
            );

      // Pages per session proxy: completed sessions that included reading phase
      const readingSessions = sessions.filter(
        (item) =>
          item.phase === "FINISHED" ||
          item.phase === "READING" ||
          item.elapsedSeconds >= 180,
      );
      const readingSpeedPagesPerSession =
        readingSessions.length === 0
          ? 1
          : Math.max(1, Math.round(readingSessions.length > 0 ? 2 : 1));

      const known = state.vocabularyProgress
        .filter(
          (item) => item.stage === "MASTERED" || item.stage === "UNDERSTOOD",
        )
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

      const prefs = deps.prefs.get();

      return {
        learnerId: state.profile.id,
        currentUnit: lesson?.unit ?? 1,
        currentLessonId: state.profile.currentLessonId,
        currentLessonTitle: lesson?.title ?? null,
        currentJuz: state.profile.currentJuz,
        currentPage: state.profile.currentPage,
        readingSpeedPagesPerSession,
        dailyStudyStreak: state.profile.readingStreak,
        averageSessionMinutes,
        knownVocabulary: known.slice(0, 12),
        weakVocabulary: deps.weakness.analyzeVocabulary(8),
        strongVocabulary: deps.strength.strongVocabulary(8),
        rulesMastered: deps.strength.rulesMastered(8),
        rulesNeedingReview: deps.weakness.analyzeRules(5),
        averageConfidence: average(
          state.vocabularyProgress.map((item) => item.confidence),
        ),
        confidenceTrend: confidenceTrend(state.vocabularyProgress),
        preferredExplanationStyle: prefs.preferredExplanationStyle,
        reviewDueCount: deps.learning.review.dueCount(),
        updatedAt: new Date().toISOString(),
      };
    },
  };
}

export type LearnerProfileService = ReturnType<
  typeof createLearnerProfileService
>;
