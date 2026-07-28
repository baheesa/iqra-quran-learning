import type { CloudStateRecord, SyncBundle } from "@/features/auth/types";

export type CloudStorageAdapter = {
  getByAuthUserId(authUserId: string): CloudStateRecord | null;
  put(input: {
    authUserId: string;
    learnerId: string;
    bundle: SyncBundle;
  }): CloudStateRecord;
  delete(authUserId: string): void;
};

export function createMemoryCloudStorage(): CloudStorageAdapter {
  const store = new Map<string, CloudStateRecord>();

  return {
    getByAuthUserId(authUserId) {
      const row = store.get(authUserId);
      return row ? structuredClone(row) : null;
    },

    put({ authUserId, learnerId, bundle }) {
      const now = new Date().toISOString();
      const existing = store.get(authUserId);
      const record: CloudStateRecord = {
        authUserId,
        learnerId: existing?.learnerId ?? learnerId,
        revision: bundle.revision,
        checksum: bundle.checksum,
        payload: structuredClone(bundle),
        updatedAt: now,
        syncedAt: now,
      };
      store.set(authUserId, record);
      return structuredClone(record);
    },

    delete(authUserId) {
      store.delete(authUserId);
    },
  };
}
