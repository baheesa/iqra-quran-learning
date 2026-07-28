import type { FileKnowledgeRepository } from "@/features/knowledge/repository/file-repository";

export function createKnowledgeBaseService(repo: FileKnowledgeRepository) {
  return {
    async getBookStatus(bookSlug: string) {
      const manifest = await repo.getManifest(bookSlug);
      if (!manifest) {
        return null;
      }

      const [pages, ocr, extracted, verifications, exported] =
        await Promise.all([
          repo.listPages(bookSlug),
          repo.listOcrResults(bookSlug),
          repo.listExtracted(bookSlug),
          repo.listVerifications(bookSlug),
          repo.getExportBundle(bookSlug),
        ]);

      return {
        manifest,
        counts: {
          pages: pages.length,
          ocr: ocr.length,
          extracted: extracted.length,
          verified: verifications.filter((item) => item.status === "VERIFIED")
            .length,
          approved: verifications.filter((item) => item.status === "APPROVED")
            .length,
          exportedPages: exported
            ? new Set([
                ...exported.lessons.map((item) => item.page),
                ...exported.vocabulary.map((item) => item.page),
              ]).size
            : 0,
        },
        pages,
        ocr,
        extracted,
        verifications,
        export: exported,
      };
    },

    async listBooksOverview() {
      const manifests = await repo.listManifests();
      return Promise.all(
        manifests.map(async (manifest) => {
          const status = await this.getBookStatus(manifest.slug);
          return {
            slug: manifest.slug,
            title: manifest.title,
            unitNumber: manifest.unitNumber,
            pipelineStatus: manifest.status,
            pageCount: manifest.pageCount,
            counts: status?.counts ?? null,
          };
        }),
      );
    },
  };
}

export type KnowledgeBaseService = ReturnType<
  typeof createKnowledgeBaseService
>;
