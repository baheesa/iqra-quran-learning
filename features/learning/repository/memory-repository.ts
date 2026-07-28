import type {
  LearnerProfile,
  LearnerState,
  LearningSessionRecord,
  LessonProgressRecord,
  ReflectionRecord,
  ReviewQueueRecord,
  RuleProgressRecord,
  VocabularyProgressRecord,
} from "@/features/learning/types";
import { DEFAULT_LEARNER_ID } from "@/features/learning/constants";
import { getCurriculumSeed } from "@/features/learning/curriculum/seed";

export function createEmptyLearnerState(
  learnerId = DEFAULT_LEARNER_ID,
): LearnerState {
  const now = new Date().toISOString();
  const firstLesson = getCurriculumSeed().lessons[0] ?? null;

  const profile: LearnerProfile = {
    id: learnerId,
    displayName: "متعلم",
    currentLessonId: firstLesson?.id ?? null,
    currentJuz: 1,
    currentPage: 1,
    dailyGoalMinutes: 20,
    readingStreak: 0,
    lastStudyDate: null,
    createdAt: now,
    updatedAt: now,
  };

  return {
    profile,
    vocabularyProgress: [],
    ruleProgress: [],
    lessonProgress: [],
    reviewQueue: [],
    reflections: [],
    sessions: [],
    activeSessionId: null,
  };
}

export type LearningRepository = {
  getState(): LearnerState;
  saveState(state: LearnerState): void;
  reset(): void;
};

export function createMemoryLearningRepository(
  initial?: LearnerState,
): LearningRepository {
  let state = initial ?? createEmptyLearnerState();

  return {
    getState() {
      return structuredClone(state);
    },
    saveState(next) {
      state = structuredClone(next);
    },
    reset() {
      state = createEmptyLearnerState(state.profile.id);
    },
  };
}

export function upsertById<T extends { id: string }>(items: T[], item: T): T[] {
  const index = items.findIndex((entry) => entry.id === item.id);
  if (index === -1) {
    return [...items, item];
  }
  const copy = [...items];
  copy[index] = item;
  return copy;
}

export function findVocabProgress(
  state: LearnerState,
  vocabularyId: string,
): VocabularyProgressRecord | undefined {
  return state.vocabularyProgress.find(
    (item) => item.vocabularyId === vocabularyId,
  );
}

export function findRuleProgress(
  state: LearnerState,
  ruleId: string,
): RuleProgressRecord | undefined {
  return state.ruleProgress.find((item) => item.ruleId === ruleId);
}

export function findLessonProgress(
  state: LearnerState,
  lessonId: string,
): LessonProgressRecord | undefined {
  return state.lessonProgress.find((item) => item.lessonId === lessonId);
}

export function findSession(
  state: LearnerState,
  sessionId: string,
): LearningSessionRecord | undefined {
  return state.sessions.find((item) => item.id === sessionId);
}

export function findReflection(
  state: LearnerState,
  reflectionId: string,
): ReflectionRecord | undefined {
  return state.reflections.find((item) => item.id === reflectionId);
}

export function findReviewItem(
  state: LearnerState,
  itemId: string,
): ReviewQueueRecord | undefined {
  return state.reviewQueue.find((item) => item.id === itemId);
}
