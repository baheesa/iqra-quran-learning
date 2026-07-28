import type { LearningEngine } from "@/features/learning/create-engine";
import type { LearnerProfileService } from "@/features/personalization/services/learner-profile-service";
import type { StrengthAnalyzer } from "@/features/personalization/services/strength-analyzer";
import type { WeaknessAnalyzer } from "@/features/personalization/services/weakness-analyzer";
import type { LearnerInsights } from "@/features/personalization/types";

function daysActiveLast7(
  sessions: Array<{ startedAt: string | null; createdAt: string }>,
): number {
  const cutoff = Date.now() - 7 * 86400000;
  const days = new Set<string>();
  for (const session of sessions) {
    const at = session.startedAt ?? session.createdAt;
    if (new Date(at).getTime() >= cutoff) {
      days.add(at.slice(0, 10));
    }
  }
  return days.size;
}

export function createInsightService(deps: {
  learning: LearningEngine;
  profile: LearnerProfileService;
  weakness: WeaknessAnalyzer;
  strength: StrengthAnalyzer;
}) {
  return {
    getInsights(): LearnerInsights {
      const profile = deps.profile.buildProfile();
      const state = deps.learning.repo.getState();
      const weekCutoff = Date.now() - 7 * 86400000;

      const weekSessions = state.sessions.filter((item) => {
        const at = item.startedAt ?? item.createdAt;
        return new Date(at).getTime() >= weekCutoff;
      });

      const completedWeek = weekSessions.filter(
        (item) => item.status === "COMPLETED",
      );
      const minutesStudied = Math.round(
        weekSessions.reduce((sum, item) => sum + item.elapsedSeconds, 0) / 60,
      );

      const wordsTouched = new Set(
        state.vocabularyProgress
          .filter((item) => {
            const at = item.lastSeenAt ?? item.updatedAt;
            return new Date(at).getTime() >= weekCutoff;
          })
          .map((item) => item.vocabularyId),
      ).size;

      const due = deps.learning.review.dueCount();
      const completedReviews = state.reviewQueue.filter(
        (item) => item.status === "COMPLETED",
      ).length;
      const totalReviewAttempts = completedReviews + due;
      const reviewCompletionRate =
        totalReviewAttempts === 0
          ? 100
          : Math.round((completedReviews / totalReviewAttempts) * 100);

      return {
        mostImprovedVocabulary: deps.strength.mostImproved(5),
        mostDifficultVocabulary: deps.weakness.analyzeVocabulary(5),
        averageConfidence: profile.averageConfidence,
        reviewCompletionRate,
        weeklySummary: {
          sessionsCompleted: completedWeek.length,
          minutesStudied,
          wordsTouched,
          reviewsDue: due,
        },
        monthlyProgress: {
          knownWordsDelta: profile.knownVocabulary.length,
          masteredRules: profile.rulesMastered.length,
          streakPeak: profile.dailyStudyStreak,
        },
        readingConsistency: {
          streak: profile.dailyStudyStreak,
          daysActiveLast7: daysActiveLast7(state.sessions),
          pagesPerSession: profile.readingSpeedPagesPerSession,
        },
        confidenceTrend: profile.confidenceTrend,
      };
    },
  };
}

export type InsightService = ReturnType<typeof createInsightService>;
