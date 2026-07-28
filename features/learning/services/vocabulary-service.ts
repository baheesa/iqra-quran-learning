import { randomUUID } from "crypto";

import { CONFIDENCE } from "@/features/learning/constants";
import { getCurriculumSeed } from "@/features/learning/curriculum/seed";
import { applyConfidenceDelta } from "@/features/learning/domain/confidence";
import {
  advanceStage,
  markNeedsReview,
} from "@/features/learning/domain/stages";
import { nextReviewAt } from "@/features/learning/domain/spaced-repetition";
import {
  findVocabProgress,
  type LearningRepository,
  upsertById,
} from "@/features/learning/repository/memory-repository";
import type {
  LearningStage,
  VocabularyEvent,
  VocabularyProgressRecord,
} from "@/features/learning/types";

function nowIso(): string {
  return new Date().toISOString();
}

function createProgress(
  learnerId: string,
  vocabularyId: string,
): VocabularyProgressRecord {
  const now = nowIso();
  return {
    id: randomUUID(),
    learnerId,
    vocabularyId,
    stage: "UNKNOWN",
    confidence: 0,
    timesSeen: 0,
    timesRecognized: 0,
    timesForgotten: 0,
    firstSeenAt: null,
    lastSeenAt: null,
    lastReviewedAt: null,
    nextReviewAt: null,
    notes: null,
    createdAt: now,
    updatedAt: now,
  };
}

function stageAfterSuccess(prior: LearningStage): LearningStage {
  if (prior === "UNKNOWN") {
    return "SEEN";
  }
  return advanceStage(prior);
}

export function createVocabularyService(repo: LearningRepository) {
  return {
    listCurriculum() {
      return getCurriculumSeed().vocabulary;
    },

    get(vocabularyId: string): VocabularyProgressRecord | null {
      const state = repo.getState();
      return findVocabProgress(state, vocabularyId) ?? null;
    },

    listProgress(): VocabularyProgressRecord[] {
      return repo.getState().vocabularyProgress;
    },

    ensure(vocabularyId: string): VocabularyProgressRecord {
      const state = repo.getState();
      const existing = findVocabProgress(state, vocabularyId);
      if (existing) {
        return existing;
      }
      const created = createProgress(state.profile.id, vocabularyId);
      state.vocabularyProgress = upsertById(state.vocabularyProgress, created);
      repo.saveState(state);
      return created;
    },

    /**
     * Apply a recognition/review event.
     * Stages advance at most one step per successful event.
     */
    applyEvent(
      vocabularyId: string,
      event: VocabularyEvent,
    ): VocabularyProgressRecord {
      const state = repo.getState();
      const prior =
        findVocabProgress(state, vocabularyId) ??
        createProgress(state.profile.id, vocabularyId);
      const now = nowIso();

      let progress: VocabularyProgressRecord = {
        ...prior,
        updatedAt: now,
      };

      switch (event) {
        case "seen": {
          progress = {
            ...progress,
            timesSeen: progress.timesSeen + 1,
            lastSeenAt: now,
            firstSeenAt: progress.firstSeenAt ?? now,
            confidence: applyConfidenceDelta(
              progress.confidence,
              CONFIDENCE.seen,
            ),
            stage: stageAfterSuccess(prior.stage),
          };
          break;
        }
        case "recognized": {
          progress = {
            ...progress,
            timesSeen: progress.timesSeen + 1,
            timesRecognized: progress.timesRecognized + 1,
            lastSeenAt: now,
            firstSeenAt: progress.firstSeenAt ?? now,
            confidence: applyConfidenceDelta(
              progress.confidence,
              CONFIDENCE.recognized,
            ),
            stage: stageAfterSuccess(prior.stage),
          };
          break;
        }
        case "forgot": {
          progress = {
            ...progress,
            timesForgotten: progress.timesForgotten + 1,
            lastSeenAt: now,
            confidence: applyConfidenceDelta(
              progress.confidence,
              CONFIDENCE.forgot,
            ),
            stage: markNeedsReview(prior.stage),
            nextReviewAt: nextReviewAt(
              applyConfidenceDelta(prior.confidence, CONFIDENCE.forgot),
              new Date(),
            ),
          };
          break;
        }
        case "review_success": {
          const confidence = applyConfidenceDelta(
            progress.confidence,
            CONFIDENCE.reviewSuccess,
          );
          progress = {
            ...progress,
            timesRecognized: progress.timesRecognized + 1,
            lastReviewedAt: now,
            lastSeenAt: now,
            confidence,
            stage: stageAfterSuccess(prior.stage),
            nextReviewAt: nextReviewAt(confidence, new Date()),
          };
          break;
        }
        case "review_fail": {
          const confidence = applyConfidenceDelta(
            progress.confidence,
            CONFIDENCE.reviewFail,
          );
          progress = {
            ...progress,
            timesForgotten: progress.timesForgotten + 1,
            lastReviewedAt: now,
            confidence,
            stage: markNeedsReview(prior.stage),
            nextReviewAt: nextReviewAt(confidence, new Date()),
          };
          break;
        }
        default:
          break;
      }

      state.vocabularyProgress = upsertById(state.vocabularyProgress, progress);
      repo.saveState(state);
      return progress;
    },
  };
}

export type VocabularyService = ReturnType<typeof createVocabularyService>;
