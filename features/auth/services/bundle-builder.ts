import { withChecksum } from "@/features/auth/domain/checksum";
import type { SyncBundle } from "@/features/auth/types";
import { createEmptyLearnerState } from "@/features/learning/repository/memory-repository";
import { defaultPreferences } from "@/features/personalization/repository/prefs-store";
import type { LearningEngine } from "@/features/learning/create-engine";
import type { PersonalizationPrefsStore } from "@/features/personalization/repository/prefs-store";
import type { ConversationRepository } from "@/features/teacher/services/conversation-service";
import type { ReadingSyncSlice } from "@/features/auth/types";
import { DEFAULT_LEARNER_ID } from "@/features/learning/constants";

export function createEmptyReadingSlice(): ReadingSyncSlice {
  return {
    position: null,
    history: [],
    bookmarks: [],
  };
}

export function createBundleBuilder(deps: {
  learning: LearningEngine;
  prefs: PersonalizationPrefsStore;
  conversations: ConversationRepository;
  learnerId?: string;
}) {
  const learnerId = deps.learnerId ?? DEFAULT_LEARNER_ID;

  return {
    buildLocal(reading?: ReadingSyncSlice): SyncBundle {
      const learning = deps.learning.repo.getState();
      const conversations = deps.conversations.listConversations(learnerId);
      return withChecksum({
        schemaVersion: 1,
        updatedAt: new Date().toISOString(),
        revision: 1,
        learning,
        reading: reading ?? createEmptyReadingSlice(),
        teacherConversations: conversations,
        personalization: deps.prefs.get(),
      });
    },

    applyBundle(bundle: SyncBundle): void {
      deps.learning.repo.saveState(bundle.learning);
      deps.prefs.set(bundle.personalization.preferredExplanationStyle);
      for (const conversation of bundle.teacherConversations) {
        deps.conversations.saveConversation(conversation);
      }
    },

    emptyBundle(): SyncBundle {
      return withChecksum({
        schemaVersion: 1,
        updatedAt: new Date().toISOString(),
        revision: 1,
        learning: createEmptyLearnerState(learnerId),
        reading: createEmptyReadingSlice(),
        teacherConversations: [],
        personalization: defaultPreferences(),
      });
    },
  };
}

export type BundleBuilder = ReturnType<typeof createBundleBuilder>;
