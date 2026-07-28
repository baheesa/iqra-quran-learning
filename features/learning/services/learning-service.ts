import type { LessonService } from "@/features/learning/services/lesson-service";
import type { ReviewService } from "@/features/learning/services/review-service";
import type { RuleService } from "@/features/learning/services/rule-service";
import type { VocabularyService } from "@/features/learning/services/vocabulary-service";
import type { VocabularyEvent } from "@/features/learning/types";

/**
 * LearningService — orchestrates recognition-first learning actions.
 * Works without AI.
 */
export function createLearningService(deps: {
  vocabulary: VocabularyService;
  rules: RuleService;
  lessons: LessonService;
  review: ReviewService;
}) {
  return {
    seeWord(vocabularyId: string) {
      const progress = deps.vocabulary.applyEvent(vocabularyId, "seen");
      const vocab = deps.vocabulary
        .listCurriculum()
        .find((item) => item.id === vocabularyId);
      if (vocab) {
        deps.lessons.recompute(vocab.lessonId);
      }
      deps.review.syncQueue();
      return progress;
    },

    recognizeWord(vocabularyId: string) {
      const progress = deps.vocabulary.applyEvent(vocabularyId, "recognized");
      const vocab = deps.vocabulary
        .listCurriculum()
        .find((item) => item.id === vocabularyId);
      if (vocab) {
        deps.lessons.recompute(vocab.lessonId);
      }
      deps.review.syncQueue();
      return progress;
    },

    forgotWord(vocabularyId: string) {
      const progress = deps.vocabulary.applyEvent(vocabularyId, "forgot");
      deps.review.syncQueue();
      return progress;
    },

    completeReview(
      vocabularyId: string,
      success: boolean,
      queueItemId?: string,
    ) {
      const event: VocabularyEvent = success ? "review_success" : "review_fail";
      const progress = deps.vocabulary.applyEvent(vocabularyId, event);
      if (queueItemId) {
        deps.review.completeItem(queueItemId);
      }
      deps.review.syncQueue();
      const vocab = deps.vocabulary
        .listCurriculum()
        .find((item) => item.id === vocabularyId);
      if (vocab) {
        deps.lessons.recompute(vocab.lessonId);
      }
      return progress;
    },

    understandRule(ruleId: string, success: boolean, note?: string) {
      const progress = deps.rules.recordUnderstanding(ruleId, {
        success,
        note,
      });
      const rule = deps.rules
        .listCurriculum()
        .find((item) => item.id === ruleId);
      if (rule) {
        deps.lessons.recompute(rule.lessonId);
      }
      return progress;
    },
  };
}

export type LearningService = ReturnType<typeof createLearningService>;
