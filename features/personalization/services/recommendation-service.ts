import type { LearnerProfileService } from "@/features/personalization/services/learner-profile-service";
import type {
  Recommendation,
  RecommendationKind,
} from "@/features/personalization/types";

/**
 * Smart recommendations — never random; always grounded in profile/weakness.
 */
export function createRecommendationService(deps: {
  profile: LearnerProfileService;
}) {
  return {
    getRecommendations(limit = 6): Recommendation[] {
      const profile = deps.profile.buildProfile();
      const items: Recommendation[] = [];

      items.push({
        id: "continue_reading",
        kind: "continue_reading",
        titleUrdu: "جہاں چھوڑا تھا وہیں سے جاری رکھیں",
        reasonUrdu: `صفحہ ${profile.currentPage} · جزو ${profile.currentJuz}`,
        priority: 100,
        href: `/quran?page=${profile.currentPage}`,
        payload: {
          page: profile.currentPage,
          juz: profile.currentJuz,
        },
      });

      if (profile.reviewDueCount > 0) {
        items.push({
          id: "practice_review_queue",
          kind: "practice_review_queue",
          titleUrdu: "آج کی نظرثانی صف مکمل کریں",
          reasonUrdu: `${profile.reviewDueCount} الفاظ نظرثانی کے منتظر`,
          priority: 95,
          href: "/curriculum",
          payload: { due: profile.reviewDueCount },
        });
      }

      if (profile.weakVocabulary[0]) {
        const weak = profile.weakVocabulary[0];
        items.push({
          id: "review_weak_words",
          kind: "review_weak_words",
          titleUrdu: "آج کے کمزور الفاظ دہرائیں",
          reasonUrdu: `${weak.arabic} · اعتماد ${weak.confidence}%`,
          priority: 90,
          href: "/curriculum",
          payload: { vocabularyId: weak.id, arabic: weak.arabic },
        });
      }

      if (profile.rulesNeedingReview[0]) {
        const rule = profile.rulesNeedingReview[0];
        items.push({
          id: "revise_rule",
          kind: "revise_rule",
          titleUrdu: `قاعدہ دہرائیں: ${rule.title}`,
          reasonUrdu: `اعتماد ${rule.confidence}% · غلطیاں ${rule.mistakes}`,
          priority: 85,
          href: "/rules",
          payload: { ruleId: rule.id, lessonId: rule.lessonId },
        });
      }

      if (profile.currentLessonId) {
        items.push({
          id: "repeat_lesson",
          kind: "repeat_lesson",
          titleUrdu: "موجودہ سبق دوبارہ دیکھیں",
          reasonUrdu: profile.currentLessonTitle ?? "موجودہ سبق",
          priority: 70,
          href: "/curriculum",
          payload: { lessonId: profile.currentLessonId },
        });
      }

      items.push({
        id: "read_more_pages",
        kind: "read_more_pages",
        titleUrdu: "دو مزید صفحات پڑھیں",
        reasonUrdu: `موجودہ رفتار تقریباً ${profile.readingSpeedPagesPerSession} صفحہ فی نشست`,
        priority: 60,
        href: `/quran?page=${profile.currentPage}`,
        payload: {
          pages: 2,
          fromPage: profile.currentPage,
        },
      });

      return items
        .sort((a, b) => b.priority - a.priority)
        .slice(0, limit)
        .map((item, index) => ({
          ...item,
          id: `${item.kind}-${index}`,
        }));
    },

    kinds(): RecommendationKind[] {
      return this.getRecommendations().map((item) => item.kind);
    },
  };
}

export type RecommendationService = ReturnType<
  typeof createRecommendationService
>;
