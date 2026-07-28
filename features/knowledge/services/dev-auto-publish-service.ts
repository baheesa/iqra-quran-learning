import {
  DEV_AUTO_APPROVE_REASON,
  DEV_AUTO_APPROVER,
  isKnowledgeAutoApproveEnabled,
} from "@/features/knowledge/providers/auto-approve-enabled";
import type { FileKnowledgeRepository } from "@/features/knowledge/repository/file-repository";
import type { ExportService } from "@/features/knowledge/services/export-service";
import type { VerificationEngine } from "@/features/knowledge/services/verification-service";
import type { KnowledgeExportBundle } from "@/features/knowledge/types";

export type DevAutoPublishResult = {
  enabled: boolean;
  skipped: boolean;
  bookSlug: string;
  approvedPages: number;
  bundle: KnowledgeExportBundle | null;
  indexEntryCount: number | null;
};

/**
 * Approves all extracted pages, exports approved knowledge, and rebuilds
 * the vocabulary index. No-op when auto-approve is disabled.
 */
export function createDevAutoPublishService(deps: {
  repo: FileKnowledgeRepository;
  verification: VerificationEngine;
  export: ExportService;
}) {
  return {
    async run(bookSlug: string): Promise<DevAutoPublishResult> {
      if (!isKnowledgeAutoApproveEnabled()) {
        return {
          enabled: false,
          skipped: true,
          bookSlug,
          approvedPages: 0,
          bundle: null,
          indexEntryCount: null,
        };
      }

      const extracted = await deps.repo.listExtracted(bookSlug);
      const approvedAt = new Date().toISOString();
      let approvedPages = 0;

      for (const page of extracted) {
        if (page.verificationStatus !== "APPROVED") {
          await deps.verification.approvePage(bookSlug, page.pageNumber, {
            note: DEV_AUTO_APPROVE_REASON,
            approvedBy: DEV_AUTO_APPROVER,
            approvedAt,
            approvalReason: DEV_AUTO_APPROVE_REASON,
          });
        }
        approvedPages += 1;
      }

      const bundle = await deps.export.exportApproved(bookSlug);

      await deps.repo.appendLog({
        bookSlug,
        stage: "dev-auto-publish",
        message: `Development auto-approve/publish: ${approvedPages} pages → export + vocabulary index`,
        level: "info",
        meta: {
          approvedBy: DEV_AUTO_APPROVER,
          approvedAt,
          reason: DEV_AUTO_APPROVE_REASON,
          vocabularyCount: bundle.vocabulary.length,
        },
      });

      const {
        clearVocabularyIndexCache,
        loadVocabularyIndex,
      } = await import("@/features/knowledge/services/vocabulary-index");
      clearVocabularyIndexCache();
      const index = await loadVocabularyIndex(deps.repo.dirs.exports);

      return {
        enabled: true,
        skipped: false,
        bookSlug,
        approvedPages,
        bundle,
        indexEntryCount: index.entryCount,
      };
    },

    /**
     * Convenience: run only when the feature flag is on (same as `run`).
     */
    maybeRun(bookSlug: string) {
      return this.run(bookSlug);
    },
  };
}

export type DevAutoPublishService = ReturnType<
  typeof createDevAutoPublishService
>;
