import { randomUUID } from "crypto";

import {
  type LearningRepository,
  upsertById,
} from "@/features/learning/repository/memory-repository";
import type { ReflectionRecord } from "@/features/learning/types";

function nowIso(): string {
  return new Date().toISOString();
}

export function createReflectionService(repo: LearningRepository) {
  return {
    list(): ReflectionRecord[] {
      return [...repo.getState().reflections].sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      );
    },

    get(id: string): ReflectionRecord | null {
      return repo.getState().reflections.find((item) => item.id === id) ?? null;
    },

    create(input: {
      understoodToday?: string | null;
      difficultWords?: string[];
      reviewTomorrow?: string | null;
      lessonId?: string | null;
      sessionId?: string | null;
      content?: string;
    }): ReflectionRecord {
      const state = repo.getState();
      const now = nowIso();
      const understood = input.understoodToday?.trim() || null;
      const difficult = input.difficultWords ?? [];
      const tomorrow = input.reviewTomorrow?.trim() || null;

      const content =
        input.content?.trim() ||
        [
          understood ? `آج سمجھا: ${understood}` : null,
          difficult.length > 0 ? `مشکل الفاظ: ${difficult.join("، ")}` : null,
          tomorrow ? `کل نظرثانی: ${tomorrow}` : null,
        ]
          .filter(Boolean)
          .join("\n") ||
        "آج کی نشست کی یادداشت";

      const reflection: ReflectionRecord = {
        id: randomUUID(),
        learnerId: state.profile.id,
        lessonId: input.lessonId ?? state.profile.currentLessonId,
        sessionId: input.sessionId ?? state.activeSessionId,
        content,
        understoodToday: understood,
        difficultWords: difficult,
        reviewTomorrow: tomorrow,
        createdAt: now,
        updatedAt: now,
      };

      state.reflections = upsertById(state.reflections, reflection);
      repo.saveState(state);
      return reflection;
    },
  };
}

export type ReflectionService = ReturnType<typeof createReflectionService>;
