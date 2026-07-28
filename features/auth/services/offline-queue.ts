import { randomUUID } from "crypto";

import type { SyncOp } from "@/features/auth/types";

type EnqueueInput =
  | { type: "push"; bundleRevision: number; id?: string }
  | { type: "pull"; id?: string }
  | { type: "migrate"; merge: boolean; id?: string };

export type OfflineQueue = {
  enqueue(op: EnqueueInput): SyncOp;
  list(): SyncOp[];
  clear(): void;
  remove(id: string): void;
  pendingCount(): number;
};

export function createMemoryOfflineQueue(initial: SyncOp[] = []): OfflineQueue {
  let ops = [...initial];

  return {
    enqueue(op) {
      const entry = {
        ...op,
        id: op.id ?? randomUUID(),
        createdAt: new Date().toISOString(),
      } as SyncOp;
      ops.push(entry);
      return entry;
    },
    list() {
      return [...ops];
    },
    clear() {
      ops = [];
    },
    remove(id) {
      ops = ops.filter((item) => item.id !== id);
    },
    pendingCount() {
      return ops.length;
    },
  };
}

/** Browser localStorage-backed queue — never blocks reading. */
export function createBrowserOfflineQueue(
  storageKey = "qls.offline.queue",
): OfflineQueue {
  function read(): SyncOp[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(storageKey);
      return raw ? (JSON.parse(raw) as SyncOp[]) : [];
    } catch {
      return [];
    }
  }

  function write(next: SyncOp[]) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(storageKey, JSON.stringify(next));
  }

  return {
    enqueue(op) {
      const ops = read();
      const entry = {
        ...op,
        id: op.id ?? crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      } as SyncOp;
      ops.push(entry);
      write(ops);
      return entry;
    },
    list() {
      return read();
    },
    clear() {
      write([]);
    },
    remove(id) {
      write(read().filter((item) => item.id !== id));
    },
    pendingCount() {
      return read().length;
    },
  };
}
