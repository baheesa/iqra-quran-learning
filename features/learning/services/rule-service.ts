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
  findRuleProgress,
  type LearningRepository,
  upsertById,
} from "@/features/learning/repository/memory-repository";
import type {
  LearningStage,
  RuleProgressRecord,
  RuleRevisionEntry,
} from "@/features/learning/types";

function nowIso(): string {
  return new Date().toISOString();
}

function createProgress(learnerId: string, ruleId: string): RuleProgressRecord {
  const now = nowIso();
  return {
    id: randomUUID(),
    learnerId,
    ruleId,
    stage: "UNKNOWN",
    confidence: 0,
    attempts: 0,
    mistakes: 0,
    revisionCount: 0,
    revisionHistory: [],
    understandingNote: null,
    lastReviewed: null,
    nextReviewAt: null,
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

export function createRuleService(repo: LearningRepository) {
  return {
    listCurriculum() {
      return getCurriculumSeed().rules;
    },

    listProgress(): RuleProgressRecord[] {
      return repo.getState().ruleProgress;
    },

    get(ruleId: string): RuleProgressRecord | null {
      return findRuleProgress(repo.getState(), ruleId) ?? null;
    },

    /**
     * Record understanding attempt. Rules stay attached to their lesson
     * via curriculum seed (rule.lessonId) — never detached.
     */
    recordUnderstanding(
      ruleId: string,
      input: { success: boolean; note?: string },
    ): RuleProgressRecord {
      const state = repo.getState();
      const prior =
        findRuleProgress(state, ruleId) ??
        createProgress(state.profile.id, ruleId);
      const now = nowIso();

      const historyEntry: RuleRevisionEntry = {
        at: now,
        confidence: prior.confidence,
        note: input.note,
      };

      let progress: RuleProgressRecord;

      if (input.success) {
        const confidence = applyConfidenceDelta(
          prior.confidence,
          CONFIDENCE.reviewSuccess,
        );
        progress = {
          ...prior,
          attempts: prior.attempts + 1,
          revisionCount: prior.revisionCount + 1,
          revisionHistory: [...prior.revisionHistory, historyEntry],
          understandingNote: input.note ?? prior.understandingNote,
          confidence,
          stage: stageAfterSuccess(prior.stage),
          lastReviewed: now,
          nextReviewAt: nextReviewAt(confidence, new Date()),
          updatedAt: now,
        };
      } else {
        const confidence = applyConfidenceDelta(
          prior.confidence,
          CONFIDENCE.reviewFail,
        );
        progress = {
          ...prior,
          attempts: prior.attempts + 1,
          mistakes: prior.mistakes + 1,
          revisionCount: prior.revisionCount + 1,
          revisionHistory: [...prior.revisionHistory, historyEntry],
          understandingNote: input.note ?? prior.understandingNote,
          confidence,
          stage: markNeedsReview(prior.stage),
          lastReviewed: now,
          nextReviewAt: nextReviewAt(confidence, new Date()),
          updatedAt: now,
        };
      }

      state.ruleProgress = upsertById(state.ruleProgress, progress);
      repo.saveState(state);
      return progress;
    },
  };
}

export type RuleService = ReturnType<typeof createRuleService>;
