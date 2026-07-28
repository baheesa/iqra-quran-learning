import {
  DAILY_STUDY_MINUTES_DEFAULT,
  DAILY_STUDY_MINUTES_MAX,
  DAILY_STUDY_MINUTES_MIN,
} from "@/lib/constants";
import type { LearnerProfileService } from "@/features/personalization/services/learner-profile-service";
import type { RecommendationService } from "@/features/personalization/services/recommendation-service";
import type {
  StudyPlan,
  StudyPlanItem,
} from "@/features/personalization/types";

const KIND_MINUTES: Record<string, number> = {
  practice_review_queue: 5,
  review_weak_words: 4,
  continue_reading: 6,
  revise_rule: 3,
  repeat_lesson: 4,
  read_more_pages: 4,
  reflection: 2,
};

/**
 * StudyPlanner — builds today's plan from recommendations (not random).
 */
export function createStudyPlanner(deps: {
  profile: LearnerProfileService;
  recommendations: RecommendationService;
}) {
  return {
    buildPlan(options?: { targetMinutes?: number }): StudyPlan {
      const profile = deps.profile.buildProfile();
      const targetMinutes = Math.min(
        DAILY_STUDY_MINUTES_MAX,
        Math.max(
          DAILY_STUDY_MINUTES_MIN,
          options?.targetMinutes ??
            (profile.averageSessionMinutes || DAILY_STUDY_MINUTES_DEFAULT),
        ),
      );

      const recs = deps.recommendations.getRecommendations(5);
      const items: StudyPlanItem[] = [];
      let used = 0;

      for (const rec of recs) {
        const minutes = KIND_MINUTES[rec.kind] ?? 3;
        if (used + minutes > targetMinutes && items.length > 0) {
          break;
        }
        items.push({
          order: items.length + 1,
          kind: rec.kind,
          titleUrdu: rec.titleUrdu,
          estimatedMinutes: minutes,
          href: rec.href,
        });
        used += minutes;
      }

      if (used + 2 <= targetMinutes) {
        items.push({
          order: items.length + 1,
          kind: "reflection",
          titleUrdu: "مختصر غور و فکر",
          estimatedMinutes: 2,
          href: "/session",
        });
      }

      return {
        targetMinutes,
        items,
        generatedAt: new Date().toISOString(),
      };
    },
  };
}

export type StudyPlanner = ReturnType<typeof createStudyPlanner>;
