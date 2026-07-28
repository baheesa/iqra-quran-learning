import {
  createMemoryCloudStorage,
  type CloudStorageAdapter,
} from "@/features/auth/services/cloud-storage-adapter";
import { createFileCloudStorage } from "@/features/auth/services/file-cloud-storage";
import { createAuthSyncEngine } from "@/features/auth/create-engine";
import { getLearningEngine } from "@/features/learning/server";
import { createFilePrefsStore } from "@/features/personalization/repository/prefs-store";
import { createFileConversationRepository } from "@/features/teacher/repository/file-conversation-repository";

let engine: ReturnType<typeof createAuthSyncEngine> | null = null;

function createCloud(): CloudStorageAdapter {
  if (
    process.env.NODE_ENV === "test" ||
    process.env.AUTH_PROVIDER === "memory"
  ) {
    return createMemoryCloudStorage();
  }
  return createFileCloudStorage();
}

export function getAuthSyncEngine() {
  if (!engine) {
    const forceMemory =
      process.env.AUTH_PROVIDER === "memory" || process.env.NODE_ENV === "test";
    engine = createAuthSyncEngine({
      useMemory: forceMemory,
      cloud: createCloud(),
      learning: forceMemory ? undefined : getLearningEngine(),
      prefs: forceMemory ? undefined : createFilePrefsStore(),
      conversations: forceMemory
        ? undefined
        : createFileConversationRepository(),
    });
  }
  return engine;
}

export function resetAuthSyncEngineForTests() {
  engine = null;
}
