import { withChecksum } from "@/features/auth/domain/checksum";
import type {
  ConflictResolution,
  ConflictStrategy,
  SyncBundle,
} from "@/features/auth/types";
import type { LearnerState } from "@/features/learning/types";
import type { ConversationRecord } from "@/features/teacher/types";

function newerIso(a: string, b: string): string {
  return a >= b ? a : b;
}

function mergeLearning(
  local: LearnerState,
  remote: LearnerState,
): LearnerState {
  const vocabMap = new Map(
    [...remote.vocabularyProgress, ...local.vocabularyProgress].map((item) => [
      item.vocabularyId,
      item,
    ]),
  );
  // Prefer newer updatedAt per vocabulary
  for (const item of local.vocabularyProgress) {
    const existing = vocabMap.get(item.vocabularyId);
    if (!existing || item.updatedAt >= existing.updatedAt) {
      vocabMap.set(item.vocabularyId, item);
    }
  }
  for (const item of remote.vocabularyProgress) {
    const existing = vocabMap.get(item.vocabularyId);
    if (!existing || item.updatedAt > existing.updatedAt) {
      vocabMap.set(item.vocabularyId, item);
    }
  }

  const ruleMap = new Map(
    [...remote.ruleProgress, ...local.ruleProgress].map((item) => [
      item.ruleId,
      item,
    ]),
  );
  for (const item of [...remote.ruleProgress, ...local.ruleProgress]) {
    const existing = ruleMap.get(item.ruleId);
    if (!existing || item.updatedAt >= existing.updatedAt) {
      ruleMap.set(item.ruleId, item);
    }
  }

  const profile =
    local.profile.updatedAt >= remote.profile.updatedAt
      ? local.profile
      : remote.profile;

  const reflectionIds = new Set<string>();
  const reflections = [...local.reflections, ...remote.reflections].filter(
    (item) => {
      if (reflectionIds.has(item.id)) return false;
      reflectionIds.add(item.id);
      return true;
    },
  );

  const sessionIds = new Set<string>();
  const sessions = [...local.sessions, ...remote.sessions].filter((item) => {
    if (sessionIds.has(item.id)) return false;
    sessionIds.add(item.id);
    return true;
  });

  return {
    profile: {
      ...profile,
      updatedAt: newerIso(local.profile.updatedAt, remote.profile.updatedAt),
    },
    vocabularyProgress: [...vocabMap.values()],
    ruleProgress: [...ruleMap.values()],
    lessonProgress: [
      ...new Map(
        [...remote.lessonProgress, ...local.lessonProgress].map((item) => [
          item.lessonId,
          item,
        ]),
      ).values(),
    ],
    reviewQueue: local.reviewQueue.length
      ? local.reviewQueue
      : remote.reviewQueue,
    reflections,
    sessions,
    activeSessionId: local.activeSessionId ?? remote.activeSessionId,
  };
}

function mergeConversations(
  local: ConversationRecord[],
  remote: ConversationRecord[],
): ConversationRecord[] {
  const map = new Map<string, ConversationRecord>();
  for (const item of [...remote, ...local]) {
    const existing = map.get(item.id);
    if (!existing || item.updatedAt >= existing.updatedAt) {
      map.set(item.id, item);
    }
  }
  return [...map.values()];
}

export function createConflictResolver() {
  return {
    resolve(
      local: SyncBundle,
      remote: SyncBundle,
      strategy: ConflictStrategy,
    ): ConflictResolution {
      if (strategy === "keep_local") {
        return {
          strategy,
          bundle: local,
          note: "مقامی ڈیٹا رکھا گیا",
        };
      }
      if (strategy === "keep_remote") {
        return {
          strategy,
          bundle: remote,
          note: "کلاؤڈ ڈیٹا رکھا گیا",
        };
      }
      if (strategy === "newer_wins") {
        const winner = local.updatedAt >= remote.updatedAt ? local : remote;
        return {
          strategy,
          bundle: winner,
          note:
            winner === local
              ? "نئے مقامی ڈیٹا کو ترجیح دی گئی"
              : "نئے کلاؤڈ ڈیٹا کو ترجیح دی گئی",
        };
      }

      // merge
      const mergedLearning = mergeLearning(local.learning, remote.learning);
      const reading =
        (local.reading.position?.updatedAt ?? "") >=
        (remote.reading.position?.updatedAt ?? "")
          ? local.reading
          : remote.reading;

      const personalization =
        local.personalization.updatedAt >= remote.personalization.updatedAt
          ? local.personalization
          : remote.personalization;

      const bundle = withChecksum({
        schemaVersion: 1,
        updatedAt: newerIso(local.updatedAt, remote.updatedAt),
        revision: Math.max(local.revision, remote.revision) + 1,
        learning: mergedLearning,
        reading,
        teacherConversations: mergeConversations(
          local.teacherConversations,
          remote.teacherConversations,
        ),
        personalization,
      });

      return {
        strategy: "merge",
        bundle,
        note: "مقامی اور کلاؤڈ ڈیٹا ضم کر دیا گیا",
      };
    },
  };
}

export type ConflictResolver = ReturnType<typeof createConflictResolver>;
