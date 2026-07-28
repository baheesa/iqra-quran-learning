import { getCurriculumSeed } from "@/features/learning/curriculum/seed";
import type { LearningRepository } from "@/features/learning/repository/memory-repository";
import type { ReviewService } from "@/features/learning/services/review-service";
import type { SessionService } from "@/features/learning/services/session-service";
import type { DashboardSummary } from "@/features/learning/types";

export function createProgressAnalyticsService(
  repo: LearningRepository,
  review: ReviewService,
  session: SessionService,
) {
  return {
    getDashboard(): DashboardSummary {
      const seed = getCurriculumSeed();
      const state = repo.getState();

      const knownWords = state.vocabularyProgress.filter(
        (item) => item.stage === "MASTERED" || item.stage === "UNDERSTOOD",
      ).length;

      const wordsInProgress = state.vocabularyProgress.filter(
        (item) =>
          item.stage === "SEEN" ||
          item.stage === "RECOGNIZING" ||
          item.stage === "NEEDS_REVIEW",
      ).length;

      const rulesMastered = state.ruleProgress.filter(
        (item) => item.stage === "MASTERED" || item.stage === "UNDERSTOOD",
      ).length;

      const currentLesson =
        seed.lessons.find(
          (item) => item.id === state.profile.currentLessonId,
        ) ?? null;

      const recentlyLearned = [...state.vocabularyProgress]
        .filter((item) => item.stage !== "UNKNOWN")
        .sort((a, b) =>
          (b.lastSeenAt ?? b.updatedAt).localeCompare(
            a.lastSeenAt ?? a.updatedAt,
          ),
        )
        .slice(0, 5)
        .map((item) => {
          const vocab = seed.vocabulary.find(
            (entry) => entry.id === item.vocabularyId,
          );
          return {
            id: item.vocabularyId,
            arabic: vocab?.arabic ?? item.vocabularyId,
            urduMeaning: vocab?.urduMeaning ?? "",
            stage: item.stage,
          };
        });

      const weakestVocabulary = [...state.vocabularyProgress]
        .filter((item) => item.stage !== "UNKNOWN")
        .sort((a, b) => a.confidence - b.confidence)
        .slice(0, 5)
        .map((item) => {
          const vocab = seed.vocabulary.find(
            (entry) => entry.id === item.vocabularyId,
          );
          return {
            id: item.vocabularyId,
            arabic: vocab?.arabic ?? item.vocabularyId,
            urduMeaning: vocab?.urduMeaning ?? "",
            confidence: item.confidence,
            stage: item.stage,
          };
        });

      const today = new Date().toISOString().slice(0, 10);
      const todaySessions = state.sessions.filter(
        (item) => (item.startedAt ?? item.createdAt).slice(0, 10) === today,
      );
      const todayLearningMinutes = Math.round(
        todaySessions.reduce((sum, item) => sum + item.elapsedSeconds, 0) / 60,
      );

      return {
        knownWords,
        wordsInProgress,
        rulesMastered,
        currentLesson,
        readingStreak: state.profile.readingStreak,
        currentJuz: state.profile.currentJuz,
        currentPage: state.profile.currentPage,
        todayLearningMinutes,
        reviewDue: review.dueCount(),
        recentlyLearned,
        weakestVocabulary,
        session: session.getActive(),
      };
    },

    updateReadingPosition(input: { juz: number; page: number }): void {
      const state = repo.getState();
      state.profile = {
        ...state.profile,
        currentJuz: input.juz,
        currentPage: input.page,
        updatedAt: new Date().toISOString(),
      };
      repo.saveState(state);
    },
  };
}

export type ProgressAnalyticsService = ReturnType<
  typeof createProgressAnalyticsService
>;
