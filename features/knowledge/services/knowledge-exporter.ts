import type { FileKnowledgeRepository } from "@/features/knowledge/repository/file-repository";
import { createExportService } from "@/features/knowledge/services/export-service";

/**
 * KnowledgeExporter — exports APPROVED knowledge only.
 */
export function createKnowledgeExporter(repo: FileKnowledgeRepository) {
  const base = createExportService(repo);
  return {
    exportApproved: base.exportApproved.bind(base),
    get: base.get.bind(base),
  };
}

export type KnowledgeExporter = ReturnType<typeof createKnowledgeExporter>;
