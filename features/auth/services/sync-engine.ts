import { withChecksum, bundlesEqual } from "@/features/auth/domain/checksum";
import type { CloudStorageAdapter } from "@/features/auth/services/cloud-storage-adapter";
import type { ConflictResolver } from "@/features/auth/services/conflict-resolver";
import type { OfflineQueue } from "@/features/auth/services/offline-queue";
import type {
  ConflictStrategy,
  SyncBundle,
  SyncStatus,
} from "@/features/auth/types";

export type SyncEngine = {
  push(input: {
    authUserId: string;
    learnerId: string;
    local: SyncBundle;
    online: boolean;
    strategy?: ConflictStrategy;
  }): {
    status: "queued" | "uploaded" | "unchanged" | "conflict_resolved";
    remote: SyncBundle | null;
    note: string;
  };
  pull(input: {
    authUserId: string;
    local: SyncBundle | null;
    online: boolean;
    strategy?: ConflictStrategy;
  }): {
    status:
      "queued" | "downloaded" | "unchanged" | "empty" | "conflict_resolved";
    bundle: SyncBundle | null;
    note: string;
  };
  sync(input: {
    authUserId: string;
    learnerId: string;
    local: SyncBundle;
    online: boolean;
    strategy?: ConflictStrategy;
  }): {
    bundle: SyncBundle;
    note: string;
    status: SyncStatus;
  };
  getStatus(input: {
    authUserId: string | null;
    online: boolean;
    localRevision: number | null;
  }): SyncStatus;
  flushQueue(input: {
    authUserId: string;
    learnerId: string;
    getLocal: () => SyncBundle;
  }): { flushed: number };
};

/**
 * SyncEngine — incremental sync; never blocks reading.
 */
export function createSyncEngine(deps: {
  cloud: CloudStorageAdapter;
  conflicts: ConflictResolver;
  queue: OfflineQueue;
}): SyncEngine {
  return {
    push({ authUserId, learnerId, local, online, strategy }) {
      if (!online) {
        deps.queue.enqueue({
          type: "push",
          bundleRevision: local.revision,
        });
        return {
          status: "queued",
          remote: null,
          note: "آف لائن — بعد میں ہم آہنگ ہوگا",
        };
      }

      const remote = deps.cloud.getByAuthUserId(authUserId);
      if (remote && bundlesEqual(remote.payload, local)) {
        return {
          status: "unchanged",
          remote: remote.payload,
          note: "کوئی تبدیلی نہیں",
        };
      }

      if (
        remote &&
        remote.checksum !== local.checksum &&
        remote.revision >= local.revision &&
        remote.updatedAt > local.updatedAt
      ) {
        const resolved = deps.conflicts.resolve(
          local,
          remote.payload,
          strategy ?? "newer_wins",
        );
        deps.cloud.put({
          authUserId,
          learnerId,
          bundle: resolved.bundle,
        });
        return {
          status: "conflict_resolved",
          remote: resolved.bundle,
          note: resolved.note,
        };
      }

      const next = withChecksum({
        ...local,
        revision: remote
          ? Math.max(remote.revision, local.revision) + 1
          : local.revision || 1,
        updatedAt: new Date().toISOString(),
      });
      deps.cloud.put({ authUserId, learnerId, bundle: next });
      return { status: "uploaded", remote: next, note: "کلاؤڈ پر محفوظ" };
    },

    pull({ authUserId, local, online, strategy }) {
      if (!online) {
        deps.queue.enqueue({ type: "pull" });
        return {
          status: "queued",
          bundle: local,
          note: "آف لائن — بعد میں کھینچا جائے گا",
        };
      }

      const remote = deps.cloud.getByAuthUserId(authUserId);
      if (!remote) {
        return { status: "empty", bundle: local, note: "کلاؤڈ خالی ہے" };
      }
      if (local && bundlesEqual(local, remote.payload)) {
        return {
          status: "unchanged",
          bundle: local,
          note: "پہلے سے ہم آہنگ",
        };
      }
      if (
        local &&
        local.checksum !== remote.checksum &&
        local.updatedAt !== remote.updatedAt
      ) {
        const resolved = deps.conflicts.resolve(
          local,
          remote.payload,
          strategy ?? "newer_wins",
        );
        return {
          status: "conflict_resolved",
          bundle: resolved.bundle,
          note: resolved.note,
        };
      }
      return {
        status: "downloaded",
        bundle: remote.payload,
        note: "کلاؤڈ سے حاصل کیا گیا",
      };
    },

    sync({ authUserId, learnerId, local, online, strategy }) {
      const pullResult = this.pull({
        authUserId,
        local,
        online,
        strategy,
      });
      const working = pullResult.bundle ?? local;
      const pushResult = this.push({
        authUserId,
        learnerId,
        local: working,
        online,
        strategy,
      });
      const finalBundle = pushResult.remote ?? working;
      return {
        bundle: finalBundle,
        note: `${pullResult.note} · ${pushResult.note}`,
        status: this.getStatus({
          authUserId,
          online,
          localRevision: finalBundle.revision,
        }),
      };
    },

    getStatus({ authUserId, online, localRevision }) {
      const remote = authUserId ? deps.cloud.getByAuthUserId(authUserId) : null;
      return {
        online,
        authenticated: Boolean(authUserId),
        guest: !authUserId,
        lastSyncedAt: remote?.syncedAt ?? null,
        pendingOps: deps.queue.pendingCount(),
        revision: remote?.revision ?? localRevision,
        conflict: false,
      };
    },

    flushQueue({ authUserId, learnerId, getLocal }) {
      if (deps.queue.pendingCount() === 0) {
        return { flushed: 0 };
      }
      const ops = deps.queue.list();
      let flushed = 0;
      for (const op of ops) {
        if (op.type === "push" || op.type === "migrate" || op.type === "pull") {
          this.sync({
            authUserId,
            learnerId,
            local: getLocal(),
            online: true,
          });
          deps.queue.remove(op.id);
          flushed += 1;
        }
      }
      return { flushed };
    },
  };
}

export type SyncService = SyncEngine;
