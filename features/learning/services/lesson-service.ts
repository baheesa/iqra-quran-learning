import { randomUUID } from "crypto";

import { getCurriculumSeed } from "@/features/learning/curriculum/seed";
import {
  findLessonProgress,
  type LearningRepository,
  upsertById,
} from "@/features/learning/repository/memory-repository";
import type { LessonProgressRecord } from "@/features/learning/types";

function nowIso(): string {
  return new Date().toISOString();
}

function createProgress(
  learnerId: string,
  lessonId: string,
): LessonProgressRecord {
  const now = nowIso();
  return {
    id: randomUUID(),
    learnerId,
    lessonId,
    startedAt: null,
    completedAt: null,
    completionPercent: 0,
    vocabularyMastery: 0,
    ruleMastery: 0,
    readingComplete: false,
    reviewStatus: "PENDING",
    confidence: 0,
    notes: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function createLessonService(repo: LearningRepository) {
  return {
    listCurriculum() {
      return getCurriculumSeed().lessons;
    },

    listProgress(): LessonProgressRecord[] {
      return repo.getState().lessonProgress;
    },

    get(lessonId: string): LessonProgressRecord | null {
      return findLessonProgress(repo.getState(), lessonId) ?? null;
    },

    getCurrentLessonId(): string | null {
      return repo.getState().profile.currentLessonId;
    },

    setCurrentLesson(lessonId: string): void {
      const state = repo.getState();
      const lesson = getCurriculumSeed().lessons.find(
        (item) => item.id === lessonId,
      );
      if (!lesson) {
        throw new Error(`Unknown lesson: ${lessonId}`);
      }
      state.profile = {
        ...state.profile,
        currentLessonId: lessonId,
        updatedAt: nowIso(),
      };
      const progress =
        findLessonProgress(state, lessonId) ??
        createProgress(state.profile.id, lessonId);
      state.lessonProgress = upsertById(state.lessonProgress, {
        ...progress,
        startedAt: progress.startedAt ?? nowIso(),
        updatedAt: nowIso(),
      });
      repo.saveState(state);
    },

    /**
     * Recompute mastery from vocabulary/rule progress for a lesson.
     */
    recompute(lessonId: string): LessonProgressRecord {
      const seed = getCurriculumSeed();
      const state = repo.getState();
      const vocabIds = seed.vocabulary
        .filter((item) => item.lessonId === lessonId)
        .map((item) => item.id);
      const ruleIds = seed.rules
        .filter((item) => item.lessonId === lessonId)
        .map((item) => item.id);

      const vocabProgress = state.vocabularyProgress.filter((item) =>
        vocabIds.includes(item.vocabularyId),
      );
      const ruleProgress = state.ruleProgress.filter((item) =>
        ruleIds.includes(item.ruleId),
      );

      const masteredVocab = vocabProgress.filter(
        (item) => item.stage === "MASTERED" || item.stage === "UNDERSTOOD",
      ).length;
      const masteredRules = ruleProgress.filter(
        (item) => item.stage === "MASTERED" || item.stage === "UNDERSTOOD",
      ).length;

      const vocabularyMastery =
        vocabIds.length === 0
          ? 0
          : Math.round((masteredVocab / vocabIds.length) * 100);
      const ruleMastery =
        ruleIds.length === 0
          ? 0
          : Math.round((masteredRules / ruleIds.length) * 100);

      const prior =
        findLessonProgress(state, lessonId) ??
        createProgress(state.profile.id, lessonId);

      const readingWeight = prior.readingComplete ? 20 : 0;
      const completionPercent = Math.min(
        100,
        Math.round(vocabularyMastery * 0.5 + ruleMastery * 0.3 + readingWeight),
      );

      const completed = completionPercent >= 90;
      const progress: LessonProgressRecord = {
        ...prior,
        vocabularyMastery,
        ruleMastery,
        completionPercent,
        confidence: Math.round((vocabularyMastery + ruleMastery) / 2),
        completedAt: completed ? (prior.completedAt ?? nowIso()) : null,
        reviewStatus: completed ? "COMPLETED" : prior.reviewStatus,
        startedAt: prior.startedAt ?? nowIso(),
        updatedAt: nowIso(),
      };

      state.lessonProgress = upsertById(state.lessonProgress, progress);
      repo.saveState(state);
      return progress;
    },

    markReadingComplete(lessonId: string): LessonProgressRecord {
      const state = repo.getState();
      const prior =
        findLessonProgress(state, lessonId) ??
        createProgress(state.profile.id, lessonId);
      state.lessonProgress = upsertById(state.lessonProgress, {
        ...prior,
        readingComplete: true,
        startedAt: prior.startedAt ?? nowIso(),
        updatedAt: nowIso(),
      });
      repo.saveState(state);
      return this.recompute(lessonId);
    },
  };
}

export type LessonService = ReturnType<typeof createLessonService>;
