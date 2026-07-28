import { describe, expect, it, beforeEach } from "vitest";

import { createAdminEngine } from "@/features/admin/create-engine";
import { roleHasPermission } from "@/features/admin/permissions";
import { createAuthSyncEngine } from "@/features/auth/create-engine";
import { createMemoryCloudStorage } from "@/features/auth/services/cloud-storage-adapter";
import { withChecksum } from "@/features/auth/domain/checksum";
import { createEmptyReadingSlice } from "@/features/auth/services/bundle-builder";
import { createMemoryAuthService } from "@/features/auth/services/memory-auth-service";
import { createMemoryOfflineQueue } from "@/features/auth/services/offline-queue";
import { createEmptyLearnerState } from "@/features/learning/repository/memory-repository";
import { createLearningEngine } from "@/features/learning/create-engine";
import { createMemoryLearningRepository } from "@/features/learning/repository/memory-repository";
import { defaultPreferences } from "@/features/personalization/repository/prefs-store";
import { getQuranPage } from "@/features/reading/services/quran-service";
import { createTeacherEngine } from "@/features/teacher/create-engine";
import { createStubTeacherLlmProvider } from "@/features/teacher/providers/llm-provider";
import { createMemoryConversationRepository } from "@/features/teacher/services/conversation-service";
import { publicErrorMessage } from "@/lib/api/errors";
import {
  checkRateLimit,
  resetRateLimitBucketsForTests,
} from "@/lib/api/rate-limit";
import {
  assertAdminOpenLocalSafeForProduction,
  isAdminOpenLocalEnabled,
} from "@/lib/security/admin-open-local";

function sampleBundle(revision = 1) {
  return withChecksum({
    schemaVersion: 1,
    updatedAt: new Date().toISOString(),
    revision,
    learning: createEmptyLearnerState("local-learner"),
    reading: createEmptyReadingSlice(),
    teacherConversations: [],
    personalization: defaultPreferences(),
  });
}

describe("production readiness flows", () => {
  beforeEach(() => {
    resetRateLimitBucketsForTests();
    delete process.env.ADMIN_OPEN_LOCAL;
  });

  it("locks ADMIN_OPEN_LOCAL by default and in production", () => {
    expect(isAdminOpenLocalEnabled()).toBe(false);

    process.env.ADMIN_OPEN_LOCAL = "1";
    const previous = process.env.NODE_ENV;
    // @ts-expect-error test override
    process.env.NODE_ENV = "development";
    expect(isAdminOpenLocalEnabled()).toBe(true);

    // @ts-expect-error test override
    process.env.NODE_ENV = "production";
    expect(isAdminOpenLocalEnabled()).toBe(false);
    expect(() => assertAdminOpenLocalSafeForProduction()).toThrow(
      /must not be enabled/,
    );

    // @ts-expect-error test override
    process.env.NODE_ENV = previous;
    delete process.env.ADMIN_OPEN_LOCAL;
  });

  it("rate-limits abusive clients", () => {
    const key = "test-client:/api/v1/auth/signin";
    for (let i = 0; i < 3; i += 1) {
      expect(checkRateLimit(key, 3, 60_000).allowed).toBe(true);
    }
    expect(checkRateLimit(key, 3, 60_000).allowed).toBe(false);
  });

  it("never exposes production stack messages", () => {
    const previous = process.env.NODE_ENV;
    // @ts-expect-error test override
    process.env.NODE_ENV = "production";
    expect(publicErrorMessage(new Error("secret db url"), "Safe")).toBe(
      "Safe",
    );
    // @ts-expect-error test override
    process.env.NODE_ENV = previous;
  });

  it("supports end-to-end reading page load", async () => {
    const page = await getQuranPage(1);
    expect(page.page).toBe(1);
    expect(page.ayahs.length).toBeGreaterThan(0);
    expect(page.ayahs[0]?.words.length).toBeGreaterThan(0);
  });

  it("supports authentication and offline queue survival", () => {
    const queue = createMemoryOfflineQueue();
    const engine = createAuthSyncEngine({
      useMemory: true,
      auth: createMemoryAuthService(),
      cloud: createMemoryCloudStorage(),
      queue,
    });

    const local = sampleBundle(1);
    const queued = engine.sync.push({
      authUserId: "user_prod",
      learnerId: "local-learner",
      local,
      online: false,
    });
    expect(queued.status).toBe("queued");
    expect(queue.pendingCount()).toBe(1);

    const surviving = createMemoryOfflineQueue(queue.list());
    expect(surviving.pendingCount()).toBe(1);

    engine.cloud.put({
      authUserId: "user_prod",
      learnerId: "local-learner",
      bundle: sampleBundle(1),
    });

    const flushed = engine.sync.flushQueue({
      authUserId: "user_prod",
      learnerId: "local-learner",
      getLocal: () => local,
    });
    expect(flushed.flushed).toBeGreaterThanOrEqual(1);
    expect(queue.pendingCount()).toBe(0);
  });

  it("supports AI Teacher ask flow (stub)", async () => {
    const learning = createLearningEngine({
      repo: createMemoryLearningRepository(),
      useMemory: true,
    });
    const teacher = createTeacherEngine({
      learning,
      conversationRepo: createMemoryConversationRepository(),
      useMemory: true,
      useStubLlm: true,
      llm: createStubTeacherLlmProvider(() => ""),
    });
    const response = await teacher.teacher.ask({
      question: "اس لفظ کی پہچان میں مدد کریں",
      reading: {
        page: 1,
        juz: 1,
        surahId: 1,
        ayahNumber: 1,
        selectedWord: {
          id: "w1",
          arabic: "بِسْمِ",
          position: 0,
        },
        selectedPhrase: null,
      },
    });
    expect(response.answer.length).toBeGreaterThan(0);
  });

  it("supports knowledge publication permission gate", async () => {
    expect(roleHasPermission("VIEWER", "knowledge.publish")).toBe(false);
    expect(roleHasPermission("ADMIN", "knowledge.publish")).toBe(true);

    const admin = createAdminEngine({ useMemory: true });
    const viewer = await admin.roles.assign({
      authUserId: "v1",
      email: "viewer@test.local",
      role: "VIEWER",
    });
    expect(() =>
      admin.roles.assert(
        {
          authUserId: viewer.authUserId,
          email: viewer.email,
          role: viewer.role,
        },
        "knowledge.publish",
      ),
    ).toThrow(/not allowed/);
  });
});
