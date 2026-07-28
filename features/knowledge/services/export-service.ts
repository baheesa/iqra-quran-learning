import type { FileKnowledgeRepository } from "@/features/knowledge/repository/file-repository";
import { rebuildAllKnowledgeIndexes } from "@/features/knowledge/services/knowledge-indexes";
import type { KnowledgeExportBundle } from "@/features/knowledge/types";

export function createExportService(repo: FileKnowledgeRepository) {
  return {
    /**
     * Export only APPROVED extracted content for downstream learning engines.
     * Rebuilds vocabulary / rules / lessons / references indexes.
     */
    async exportApproved(bookSlug: string): Promise<KnowledgeExportBundle> {
      const extracted = await repo.listExtracted(bookSlug);
      const approved = extracted.filter(
        (item) => item.verificationStatus === "APPROVED",
      );

      const bundle: KnowledgeExportBundle = {
        bookSlug,
        exportedAt: new Date().toISOString(),
        lessons: approved.flatMap((item) => item.lessons),
        vocabulary: approved.flatMap((item) => item.vocabulary),
        rules: approved.flatMap((item) => item.rules),
        exercises: approved.flatMap((item) => item.exercises),
        quranReferences: approved.flatMap(
          (item) => item.quranReferences ?? [],
        ),
      };

      await repo.saveExportBundle(bundle);
      const indexes = await rebuildAllKnowledgeIndexes(repo.dirs.exports);
      await repo.appendLog({
        bookSlug,
        stage: "export",
        message: `Exported approved knowledge (${approved.length} pages); indexes vocab=${indexes.vocabularyEntries} rules=${indexes.rules} lessons=${indexes.lessons} refs=${indexes.references}`,
        level: "info",
      });

      return bundle;
    },

    get(bookSlug: string) {
      return repo.getExportBundle(bookSlug);
    },
  };
}

export type ExportService = ReturnType<typeof createExportService>;
