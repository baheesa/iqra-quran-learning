import { randomUUID } from "crypto";

import type { AuditLogService } from "@/features/admin/services/audit-log-service";
import type { KnowledgeValidationService } from "@/features/admin/services/validation-service";
import type { AdminStore } from "@/features/admin/repository/types";
import type {
  PublicationRecord,
  StaffActor,
} from "@/features/admin/types";
import type { KnowledgeEngine } from "@/features/knowledge/create-engine";

export function createPublicationService(deps: {
  knowledge: KnowledgeEngine;
  store: AdminStore;
  validation: KnowledgeValidationService;
  audit: AuditLogService;
}) {
  return {
    async publish(input: {
      bookSlug: string;
      actor?: StaffActor | null;
    }): Promise<{ publication: PublicationRecord; ok: boolean }> {
      const report = await deps.validation.validateBook(input.bookSlug);
      await deps.audit.record({
        actor: input.actor,
        action: "VALIDATION_RUN",
        bookSlug: input.bookSlug,
        objectType: "BOOK",
        objectId: input.bookSlug,
        meta: { ok: report.ok, issues: report.issues.length },
      });

      const existing = await deps.store.listPublications(input.bookSlug);
      const version = (existing[0]?.version ?? 0) + 1;

      if (!report.ok) {
        const failed: PublicationRecord = {
          id: randomUUID(),
          bookSlug: input.bookSlug,
          version,
          status: "FAILED_VALIDATION",
          validationReport: report,
          publishedBy: input.actor?.authUserId ?? null,
          publishedAt: new Date().toISOString(),
        };
        await deps.store.savePublication(failed);
        return { publication: failed, ok: false };
      }

      // exportApproved also rebuilds knowledge/books/exports/vocabulary-index.json
      await deps.knowledge.export.exportApproved(input.bookSlug);

      const manifest = await deps.knowledge.books.get(input.bookSlug);
      if (manifest) {
        await deps.knowledge.repo.saveManifest({
          ...manifest,
          status: "APPROVED",
          version: String(version),
          updatedAt: new Date().toISOString(),
        });
      }

      const publication: PublicationRecord = {
        id: randomUUID(),
        bookSlug: input.bookSlug,
        version,
        status: "PUBLISHED",
        validationReport: report,
        publishedBy: input.actor?.authUserId ?? null,
        publishedAt: new Date().toISOString(),
      };
      await deps.store.savePublication(publication);
      await deps.audit.record({
        actor: input.actor,
        action: "KNOWLEDGE_PUBLISHED",
        bookSlug: input.bookSlug,
        objectType: "BOOK",
        objectId: input.bookSlug,
        meta: { version },
      });

      return { publication, ok: true };
    },

    list(bookSlug?: string) {
      return deps.store.listPublications(bookSlug);
    },
  };
}

export type PublicationService = ReturnType<typeof createPublicationService>;
