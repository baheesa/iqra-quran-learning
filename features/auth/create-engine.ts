import { createAuthServiceFromEnv } from "@/features/auth/services/session-manager";
import { createSessionManager } from "@/features/auth/services/session-manager";
import type { AuthService } from "@/features/auth/services/memory-auth-service";
import {
  createMemoryCloudStorage,
  type CloudStorageAdapter,
} from "@/features/auth/services/cloud-storage-adapter";
import { createConflictResolver } from "@/features/auth/services/conflict-resolver";
import {
  createMemoryOfflineQueue,
  type OfflineQueue,
} from "@/features/auth/services/offline-queue";
import { createMigrationService } from "@/features/auth/services/migration-service";
import { createSyncEngine } from "@/features/auth/services/sync-engine";
import { createBundleBuilder } from "@/features/auth/services/bundle-builder";
import {
  createLearningEngine,
  type LearningEngine,
} from "@/features/learning/create-engine";
import {
  createMemoryPrefsStore,
  createFilePrefsStore,
  type PersonalizationPrefsStore,
} from "@/features/personalization/repository/prefs-store";
import {
  createMemoryConversationRepository,
  type ConversationRepository,
} from "@/features/teacher/services/conversation-service";
import { createFileConversationRepository } from "@/features/teacher/repository/file-conversation-repository";

export function createAuthSyncEngine(deps?: {
  auth?: AuthService;
  cloud?: CloudStorageAdapter;
  queue?: OfflineQueue;
  learning?: LearningEngine;
  prefs?: PersonalizationPrefsStore;
  conversations?: ConversationRepository;
  useMemory?: boolean;
}) {
  const useMemory = deps?.useMemory ?? process.env.NODE_ENV === "test";
  const auth =
    deps?.auth ?? createAuthServiceFromEnv({ forceMemory: useMemory });
  const sessions = createSessionManager(auth);
  const cloud = deps?.cloud ?? createMemoryCloudStorage();
  const queue = deps?.queue ?? createMemoryOfflineQueue();
  const conflicts = createConflictResolver();
  const migration = createMigrationService({ cloud, conflicts });
  const sync = createSyncEngine({ cloud, conflicts, queue });

  const learning = deps?.learning ?? createLearningEngine({ useMemory });
  const prefs =
    deps?.prefs ??
    (useMemory ? createMemoryPrefsStore() : createFilePrefsStore());
  const conversations =
    deps?.conversations ??
    (useMemory
      ? createMemoryConversationRepository()
      : createFileConversationRepository());

  const bundles = createBundleBuilder({
    learning,
    prefs,
    conversations,
  });

  return {
    auth,
    sessions,
    cloud,
    queue,
    conflicts,
    migration,
    sync,
    bundles,
    learning,
    prefs,
    conversations,
  };
}

export type AuthSyncEngine = ReturnType<typeof createAuthSyncEngine>;
