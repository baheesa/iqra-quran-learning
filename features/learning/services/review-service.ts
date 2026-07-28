import { randomUUID } from "crypto";

import { REVIEW } from "@/features/learning/constants";
import { getCurriculumSeed } from "@/features/learning/curriculum/seed";
import { reviewPriorityScore } from "@/features/learning/domain/spaced-repetition";
import {
  type LearningRepository,
  upsertById,
} from "@/features/learning/repository/memory-repository";
import type {
  CurriculumVocabulary,
  ReviewQueueRecord,
  VocabularyProgressRecord,
} from "@/features/learning/types";

function nowIso(): string {
  return new Date().toISOString();
}

export type ReviewCandidate = {
  vocabulary: CurriculumVocabulary;
  progress: VocabularyProgressRecord | null;
  priority: number;
  dueAt: string;
};

export function createReviewService(repo: LearningRepository) {
  return {
    /**
     * Build prioritized review candidates (not random).
     */
    buildQueue(options?: { limit?: number; now?: Date }): ReviewCandidate[] {
      const limit = options?.limit ?? REVIEW.maxQueue;
      const now = options?.now ?? new Date();
      const seed = getCurriculumSeed();
      const state = repo.getState();
      const currentLessonId = state.profile.currentLessonId;

      const candidates: ReviewCandidate[] = seed.vocabulary.map((vocab) => {
        const progress =
          state.vocabularyProgress.find(
            (item) => item.vocabularyId === vocab.id,
          ) ?? null;

        const lessonImportance =
          vocab.lessonId === currentLessonId ? REVIEW.lessonImportanceBoost : 0;

        const priority = reviewPriorityScore({
          confidence: progress?.confidence ?? 0,
          lastReviewedAt:
            progress?.lastReviewedAt ?? progress?.lastSeenAt ?? null,
          timesForgotten: progress?.timesForgotten ?? 0,
          frequency: vocab.frequency,
          lessonImportance,
          stage: progress?.stage ?? "UNKNOWN",
          now,
        });

        const dueAt =
          progress?.nextReviewAt ??
          (progress ? nowIso() : new Date(0).toISOString());

        return { vocabulary: vocab, progress, priority, dueAt };
      });

      return candidates
        .filter((item) => {
          if (!item.progress) {
            return false;
          }
          if (item.progress.stage === "UNKNOWN") {
            return false;
          }
          if (item.progress.stage === "NEEDS_REVIEW") {
            return true;
          }
          if (!item.progress.nextReviewAt) {
            return true;
          }
          return new Date(item.dueAt).getTime() <= now.getTime();
        })
        .sort((a, b) => b.priority - a.priority)
        .slice(0, limit);
    },

    syncQueue(options?: { limit?: number; now?: Date }): ReviewQueueRecord[] {
      const state = repo.getState();
      const built = this.buildQueue(options);
      const now = nowIso();

      const records: ReviewQueueRecord[] = built.map((item) => {
        const existing = state.reviewQueue.find(
          (entry) =>
            entry.objectType === "VOCABULARY" &&
            entry.objectId === item.vocabulary.id &&
            entry.status !== "COMPLETED",
        );

        const record: ReviewQueueRecord = {
          id: existing?.id ?? randomUUID(),
          learnerId: state.profile.id,
          objectType: "VOCABULARY",
          objectId: item.vocabulary.id,
          priority: item.priority,
          dueAt: item.dueAt,
          status: "DUE",
          createdAt: existing?.createdAt ?? now,
          updatedAt: now,
        };
        return record;
      });

      const completed = state.reviewQueue.filter(
        (item) => item.status === "COMPLETED",
      );
      state.reviewQueue = [...completed, ...records];
      repo.saveState(state);
      return records;
    },

    completeItem(itemId: string): ReviewQueueRecord | null {
      const state = repo.getState();
      const item = state.reviewQueue.find((entry) => entry.id === itemId);
      if (!item) {
        return null;
      }
      const updated: ReviewQueueRecord = {
        ...item,
        status: "COMPLETED",
        updatedAt: nowIso(),
      };
      state.reviewQueue = upsertById(state.reviewQueue, updated);
      repo.saveState(state);
      return updated;
    },

    dueCount(now = new Date()): number {
      return this.buildQueue({ now }).length;
    },
  };
}

export type ReviewService = ReturnType<typeof createReviewService>;
