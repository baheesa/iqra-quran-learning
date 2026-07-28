import { randomUUID } from "crypto";

import type { AdminStore } from "@/features/admin/repository/types";
import type {
  KnowledgeVersionRecord,
  StaffActor,
} from "@/features/admin/types";
import type { AuditLogService } from "@/features/admin/services/audit-log-service";

export function createVersionService(
  store: AdminStore,
  audit?: AuditLogService,
) {
  return {
    async create(input: {
      bookSlug: string;
      objectType: string;
      objectId: string;
      payload: unknown;
      actor?: StaffActor | null;
      note?: string | null;
    }): Promise<KnowledgeVersionRecord> {
      const existing = await store.listVersions(
        input.bookSlug,
        input.objectType,
        input.objectId,
      );
      const version = (existing[0]?.version ?? 0) + 1;
      const record: KnowledgeVersionRecord = {
        id: randomUUID(),
        bookSlug: input.bookSlug,
        objectType: input.objectType,
        objectId: input.objectId,
        version,
        payload: input.payload,
        createdBy: input.actor?.authUserId ?? null,
        note: input.note ?? null,
        createdAt: new Date().toISOString(),
      };
      await store.saveVersion(record);
      await audit?.record({
        actor: input.actor,
        action: "VERSION_CREATED",
        objectType: input.objectType,
        objectId: input.objectId,
        bookSlug: input.bookSlug,
        meta: { version },
      });
      return record;
    },

    list(bookSlug: string, objectType: string, objectId: string) {
      return store.listVersions(bookSlug, objectType, objectId);
    },

    get(
      bookSlug: string,
      objectType: string,
      objectId: string,
      version: number,
    ) {
      return store.getVersion(bookSlug, objectType, objectId, version);
    },

    async rollback(input: {
      bookSlug: string;
      objectType: string;
      objectId: string;
      version: number;
      actor?: StaffActor | null;
    }): Promise<KnowledgeVersionRecord> {
      const target = await store.getVersion(
        input.bookSlug,
        input.objectType,
        input.objectId,
        input.version,
      );
      if (!target) {
        throw new Error(
          `Version ${input.version} not found for ${input.objectType}/${input.objectId}`,
        );
      }
      const restored = await this.create({
        bookSlug: input.bookSlug,
        objectType: input.objectType,
        objectId: input.objectId,
        payload: target.payload,
        actor: input.actor,
        note: `Rollback to v${input.version}`,
      });
      await audit?.record({
        actor: input.actor,
        action: "VERSION_ROLLBACK",
        objectType: input.objectType,
        objectId: input.objectId,
        bookSlug: input.bookSlug,
        meta: { fromVersion: input.version, toVersion: restored.version },
      });
      return restored;
    },
  };
}

export type VersionService = ReturnType<typeof createVersionService>;
