import { randomUUID } from "crypto";

import { REVIEW, SESSION, SESSION_PHASES } from "@/features/learning/constants";
import { getCurriculumSeed } from "@/features/learning/curriculum/seed";
import {
  findSession,
  type LearningRepository,
  upsertById,
} from "@/features/learning/repository/memory-repository";
import type { ReviewService } from "@/features/learning/services/review-service";
import type {
  LearningSessionPhase,
  LearningSessionRecord,
} from "@/features/learning/types";

function nowIso(): string {
  return new Date().toISOString();
}

function estimateRemaining(
  phase: LearningSessionPhase,
  elapsedSeconds: number,
  targetMinutes: number,
): number {
  const phaseIndex = SESSION_PHASES.indexOf(phase);
  const remainingPhases = SESSION_PHASES.slice(phaseIndex);
  let planned = 0;
  for (const item of remainingPhases) {
    if (item === "FINISHED") continue;
    planned +=
      SESSION.phaseMinutes[item as keyof typeof SESSION.phaseMinutes] ?? 0;
  }
  const elapsedMinutes = elapsedSeconds / 60;
  const remaining = Math.max(
    0,
    Math.min(targetMinutes, planned) - elapsedMinutes * 0.2,
  );
  return Math.round(Math.max(0, remaining));
}

function nextPhase(phase: LearningSessionPhase): LearningSessionPhase {
  const index = SESSION_PHASES.indexOf(phase);
  if (index < 0 || index >= SESSION_PHASES.length - 1) {
    return "FINISHED";
  }
  return SESSION_PHASES[index + 1]!;
}

export function createSessionService(
  repo: LearningRepository,
  review: ReviewService,
) {
  return {
    getActive(): LearningSessionRecord | null {
      const state = repo.getState();
      if (!state.activeSessionId) {
        return null;
      }
      return findSession(state, state.activeSessionId) ?? null;
    },

    list(): LearningSessionRecord[] {
      return [...repo.getState().sessions].sort((a, b) =>
        (b.startedAt ?? b.createdAt).localeCompare(a.startedAt ?? a.createdAt),
      );
    },

    /**
     * Start daily session: Review → Reading → Recognize → New words → Reflection → Finish
     */
    start(options?: { targetMinutes?: number }): LearningSessionRecord {
      const state = repo.getState();
      const existing = state.activeSessionId
        ? findSession(state, state.activeSessionId)
        : null;
      if (existing && existing.status === "IN_PROGRESS") {
        return existing;
      }

      const targetMinutes = Math.min(
        SESSION.maxMinutes,
        Math.max(
          SESSION.minMinutes,
          options?.targetMinutes ??
            state.profile.dailyGoalMinutes ??
            SESSION.defaultMinutes,
        ),
      );

      const due = review.syncQueue({ limit: REVIEW.maxQueue });
      const reviewWordIds = due.map((item) => item.objectId);

      const seed = getCurriculumSeed();
      const currentLessonId = state.profile.currentLessonId;
      const knownIds = new Set(
        state.vocabularyProgress.map((item) => item.vocabularyId),
      );
      const newWordIds = seed.vocabulary
        .filter(
          (item) => item.lessonId === currentLessonId && !knownIds.has(item.id),
        )
        .slice(0, REVIEW.maxNewWordsPerSession)
        .map((item) => item.id);

      // If all known, pick low-confidence words from current lesson as "new practice"
      const practiceIds =
        newWordIds.length > 0
          ? newWordIds
          : seed.vocabulary
              .filter((item) => item.lessonId === currentLessonId)
              .slice(0, REVIEW.maxNewWordsPerSession)
              .map((item) => item.id);

      const now = nowIso();
      const session: LearningSessionRecord = {
        id: randomUUID(),
        learnerId: state.profile.id,
        status: "IN_PROGRESS",
        phase: "REVIEW",
        targetMinutes,
        elapsedSeconds: 0,
        estimatedRemainingMinutes: estimateRemaining(
          "REVIEW",
          0,
          targetMinutes,
        ),
        startedAt: now,
        endedAt: null,
        reviewWordIds,
        newWordIds: practiceIds,
        reflectionId: null,
        notes: null,
        createdAt: now,
        updatedAt: now,
      };

      state.sessions = upsertById(state.sessions, session);
      state.activeSessionId = session.id;
      repo.saveState(state);
      return session;
    },

    advancePhase(sessionId?: string): LearningSessionRecord {
      const state = repo.getState();
      const id = sessionId ?? state.activeSessionId;
      if (!id) {
        throw new Error("No active learning session");
      }
      const session = findSession(state, id);
      if (!session) {
        throw new Error(`Unknown session: ${id}`);
      }

      const phase = nextPhase(session.phase);
      const elapsedSeconds =
        session.elapsedSeconds +
        (SESSION.phaseMinutes[
          session.phase as keyof typeof SESSION.phaseMinutes
        ] ?? 0) *
          60;

      const updated: LearningSessionRecord = {
        ...session,
        phase,
        elapsedSeconds,
        estimatedRemainingMinutes: estimateRemaining(
          phase,
          elapsedSeconds,
          session.targetMinutes,
        ),
        status: phase === "FINISHED" ? "COMPLETED" : session.status,
        endedAt: phase === "FINISHED" ? nowIso() : null,
        updatedAt: nowIso(),
      };

      if (phase === "FINISHED") {
        state.activeSessionId = null;
        const today = nowIso().slice(0, 10);
        const last = state.profile.lastStudyDate?.slice(0, 10) ?? null;
        let streak = state.profile.readingStreak;
        if (last === today) {
          // same day
        } else if (
          last &&
          new Date(today).getTime() - new Date(last).getTime() <=
            1000 * 60 * 60 * 24
        ) {
          streak += 1;
        } else {
          streak = 1;
        }
        state.profile = {
          ...state.profile,
          readingStreak: streak,
          lastStudyDate: nowIso(),
          updatedAt: nowIso(),
        };
      }

      state.sessions = upsertById(state.sessions, updated);
      repo.saveState(state);
      return updated;
    },

    attachReflection(
      reflectionId: string,
      sessionId?: string,
    ): LearningSessionRecord {
      const state = repo.getState();
      const id = sessionId ?? state.activeSessionId;
      if (!id) {
        throw new Error("No active learning session");
      }
      const session = findSession(state, id);
      if (!session) {
        throw new Error(`Unknown session: ${id}`);
      }
      const updated = {
        ...session,
        reflectionId,
        updatedAt: nowIso(),
      };
      state.sessions = upsertById(state.sessions, updated);
      repo.saveState(state);
      return updated;
    },

    tick(elapsedSeconds: number, sessionId?: string): LearningSessionRecord {
      const state = repo.getState();
      const id = sessionId ?? state.activeSessionId;
      if (!id) {
        throw new Error("No active learning session");
      }
      const session = findSession(state, id);
      if (!session) {
        throw new Error(`Unknown session: ${id}`);
      }
      const updated: LearningSessionRecord = {
        ...session,
        elapsedSeconds,
        estimatedRemainingMinutes: estimateRemaining(
          session.phase,
          elapsedSeconds,
          session.targetMinutes,
        ),
        updatedAt: nowIso(),
      };
      state.sessions = upsertById(state.sessions, updated);
      repo.saveState(state);
      return updated;
    },
  };
}

export type SessionService = ReturnType<typeof createSessionService>;
