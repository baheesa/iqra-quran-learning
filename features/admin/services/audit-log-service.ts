import { randomUUID } from "crypto";

import type { AdminStore } from "@/features/admin/repository/types";
import type {
  AuditAction,
  AuditLogRecord,
  StaffActor,
} from "@/features/admin/types";

export function createAuditLogService(store: AdminStore) {
  return {
    async record(input: {
      actor?: StaffActor | null;
      action: AuditAction;
      objectType?: string | null;
      objectId?: string | null;
      bookSlug?: string | null;
      meta?: Record<string, unknown> | null;
    }): Promise<AuditLogRecord> {
      const entry: AuditLogRecord = {
        id: randomUUID(),
        actorId: input.actor?.authUserId ?? null,
        actorEmail: input.actor?.email ?? null,
        action: input.action,
        objectType: input.objectType ?? null,
        objectId: input.objectId ?? null,
        bookSlug: input.bookSlug ?? null,
        meta: input.meta ?? null,
        createdAt: new Date().toISOString(),
      };
      await store.appendAudit(entry);
      return entry;
    },

    list(limit?: number) {
      return store.listAudit(limit);
    },
  };
}

export type AuditLogService = ReturnType<typeof createAuditLogService>;
