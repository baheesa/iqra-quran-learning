import { describe, expect, it } from "vitest";

import { createAuthSyncEngine } from "@/features/auth/create-engine";
import { withChecksum } from "@/features/auth/domain/checksum";
import { createMemoryCloudStorage } from "@/features/auth/services/cloud-storage-adapter";
import { createMemoryOfflineQueue } from "@/features/auth/services/offline-queue";
import { createEmptyReadingSlice } from "@/features/auth/services/bundle-builder";
import { createMemoryAuthService } from "@/features/auth/services/memory-auth-service";
import { createEmptyLearnerState } from "@/features/learning/repository/memory-repository";
import { defaultPreferences } from "@/features/personalization/repository/prefs-store";

function engine() {
  return createAuthSyncEngine({
    useMemory: true,
    auth: createMemoryAuthService(),
    cloud: createMemoryCloudStorage(),
    queue: createMemoryOfflineQueue(),
  });
}

function sampleBundle(revision = 1, extraVocab = false) {
  const learning = createEmptyLearnerState("local-learner");
  if (extraVocab) {
    learning.vocabularyProgress.push({
      id: "vp1",
      learnerId: "local-learner",
      vocabularyId: "vocab-bism",
      stage: "SEEN",
      confidence: 10,
      timesSeen: 1,
      timesRecognized: 0,
      timesForgotten: 0,
      firstSeenAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
      lastReviewedAt: null,
      nextReviewAt: null,
      notes: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
  return withChecksum({
    schemaVersion: 1,
    updatedAt: new Date().toISOString(),
    revision,
    learning,
    reading: createEmptyReadingSlice(),
    teacherConversations: [],
    personalization: defaultPreferences(),
  });
}

describe("authentication", () => {
  it("signs up and signs in", async () => {
    const authEngine = engine();
    const signedUp = await authEngine.auth.signUp({
      email: "learner@example.com",
      password: "secret1",
      displayName: "متعلم",
    });
    expect(signedUp.ok).toBe(true);
    if (!signedUp.ok) return;

    const session = await authEngine.sessions.resolve(
      signedUp.session.accessToken,
    );
    expect(session.guest).toBe(false);
    expect(session.session?.user.email).toBe("learner@example.com");

    const signedIn = await authEngine.auth.signIn({
      email: "learner@example.com",
      password: "secret1",
    });
    expect(signedIn.ok).toBe(true);
  });

  it("supports guest mode without session", async () => {
    const authEngine = engine();
    const resolved = await authEngine.sessions.resolve(null);
    expect(resolved.guest).toBe(true);
  });
});

describe("migration", () => {
  it("asks for confirmation when local and cloud both have data", async () => {
    const authEngine = engine();
    const signedUp = await authEngine.auth.signUp({
      email: "merge@example.com",
      password: "secret1",
    });
    expect(signedUp.ok).toBe(true);
    if (!signedUp.ok) return;

    const local = sampleBundle(1, true);
    authEngine.cloud.put({
      authUserId: signedUp.session.user.id,
      learnerId: "local-learner",
      bundle: sampleBundle(2, true),
    });

    const preview = authEngine.migration.preview({
      authUserId: signedUp.session.user.id,
      local,
    });
    expect(preview.requiresUserChoice).toBe(true);

    const applied = authEngine.migration.apply({
      authUserId: signedUp.session.user.id,
      learnerId: "local-learner",
      local,
      merge: true,
      strategy: "merge",
    });
    expect(applied.bundle.revision).toBeGreaterThanOrEqual(2);
  });
});

describe("offline queue", () => {
  it("queues push when offline and flushes later", () => {
    const authEngine = engine();
    const local = sampleBundle(1, true);
    const queued = authEngine.sync.push({
      authUserId: "user_x",
      learnerId: "local-learner",
      local,
      online: false,
    });
    expect(queued.status).toBe("queued");
    expect(authEngine.queue.pendingCount()).toBe(1);

    // Seed cloud user via signup path identity
    authEngine.cloud.put({
      authUserId: "user_x",
      learnerId: "local-learner",
      bundle: sampleBundle(1),
    });

    const flushed = authEngine.sync.flushQueue({
      authUserId: "user_x",
      learnerId: "local-learner",
      getLocal: () => local,
    });
    expect(flushed.flushed).toBeGreaterThanOrEqual(1);
    expect(authEngine.queue.pendingCount()).toBe(0);
  });
});

describe("synchronization", () => {
  it("skips upload when checksum unchanged", async () => {
    const authEngine = engine();
    const signedUp = await authEngine.auth.signUp({
      email: "sync@example.com",
      password: "secret1",
    });
    expect(signedUp.ok).toBe(true);
    if (!signedUp.ok) return;

    const local = sampleBundle(1, true);
    const first = authEngine.sync.push({
      authUserId: signedUp.session.user.id,
      learnerId: "local-learner",
      local,
      online: true,
    });
    expect(first.status).toBe("uploaded");

    const second = authEngine.sync.push({
      authUserId: signedUp.session.user.id,
      learnerId: "local-learner",
      local: first.remote!,
      online: true,
    });
    expect(second.status).toBe("unchanged");
  });
});

describe("conflict resolution", () => {
  it("merges vocabulary from both sides", () => {
    const authEngine = engine();
    const local = sampleBundle(1, true);
    const remoteLearning = createEmptyLearnerState("local-learner");
    remoteLearning.vocabularyProgress.push({
      id: "vp2",
      learnerId: "local-learner",
      vocabularyId: "vocab-allah",
      stage: "RECOGNIZING",
      confidence: 40,
      timesSeen: 2,
      timesRecognized: 1,
      timesForgotten: 0,
      firstSeenAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
      lastReviewedAt: null,
      nextReviewAt: null,
      notes: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const remote = withChecksum({
      schemaVersion: 1,
      updatedAt: new Date().toISOString(),
      revision: 2,
      learning: remoteLearning,
      reading: createEmptyReadingSlice(),
      teacherConversations: [],
      personalization: defaultPreferences(),
    });

    const resolved = authEngine.conflicts.resolve(local, remote, "merge");
    const ids = resolved.bundle.learning.vocabularyProgress.map(
      (item) => item.vocabularyId,
    );
    expect(ids).toContain("vocab-bism");
    expect(ids).toContain("vocab-allah");
  });
});
