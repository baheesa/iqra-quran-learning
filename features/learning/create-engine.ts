import { createFileLearningRepository } from "@/features/learning/repository/file-repository";
import {
  createMemoryLearningRepository,
  type LearningRepository,
} from "@/features/learning/repository/memory-repository";
import { createLearningService } from "@/features/learning/services/learning-service";
import { createLessonService } from "@/features/learning/services/lesson-service";
import { createProgressAnalyticsService } from "@/features/learning/services/progress-analytics-service";
import { createReflectionService } from "@/features/learning/services/reflection-service";
import { createReviewService } from "@/features/learning/services/review-service";
import { createRuleService } from "@/features/learning/services/rule-service";
import { createSessionService } from "@/features/learning/services/session-service";
import { createVocabularyService } from "@/features/learning/services/vocabulary-service";

export function createLearningEngine(deps?: {
  repo?: LearningRepository;
  /** Use in-memory store (tests). Default: file store. */
  useMemory?: boolean;
}) {
  const repo =
    deps?.repo ??
    (deps?.useMemory
      ? createMemoryLearningRepository()
      : createFileLearningRepository());

  const vocabulary = createVocabularyService(repo);
  const rules = createRuleService(repo);
  const lessons = createLessonService(repo);
  const review = createReviewService(repo);
  const reflections = createReflectionService(repo);
  const sessions = createSessionService(repo, review);
  const analytics = createProgressAnalyticsService(repo, review, sessions);
  const learning = createLearningService({
    vocabulary,
    rules,
    lessons,
    review,
  });

  return {
    repo,
    vocabulary,
    rules,
    lessons,
    review,
    reflections,
    sessions,
    analytics,
    learning,
  };
}

export type LearningEngine = ReturnType<typeof createLearningEngine>;
