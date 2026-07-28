import {
  discoverOriginalBooks,
  slugifyBookFileName,
} from "@/features/knowledge/providers/book-discovery";
import type { FileKnowledgeRepository } from "@/features/knowledge/repository/file-repository";
import type { BookManifest, DiscoveredBook } from "@/features/knowledge/types";

export function createBookService(repo: FileKnowledgeRepository) {
  return {
    async discover(): Promise<DiscoveredBook[]> {
      return discoverOriginalBooks(repo.dirs.original);
    },

    async list(): Promise<BookManifest[]> {
      return repo.listManifests();
    },

    async get(bookSlug: string): Promise<BookManifest | null> {
      return repo.getManifest(bookSlug);
    },

    async register(discovered: DiscoveredBook): Promise<BookManifest> {
      const slug = slugifyBookFileName(discovered.fileName);
      const existing = await repo.getManifest(slug);
      const now = new Date().toISOString();

      const manifest: BookManifest = {
        id: existing?.id ?? crypto.randomUUID(),
        slug,
        title: discovered.title,
        unitNumber: discovered.unitNumber,
        originalFileName: discovered.fileName,
        originalRelativePath: `original/${discovered.fileName}`,
        checksum: discovered.checksum,
        pageCount: existing?.pageCount ?? null,
        status: existing?.status ?? "REGISTERED",
        importedAt: existing?.importedAt ?? now,
        updatedAt: now,
        version: existing?.version ?? "1",
        sourceKind: discovered.sourceKind,
        characterCount: existing?.characterCount ?? null,
        sectionCount: existing?.sectionCount ?? null,
      };

      if (manifest.status === "DISCOVERED") {
        manifest.status = "REGISTERED";
      }

      await repo.saveManifest(manifest);
      await repo.appendLog({
        bookSlug: slug,
        stage: "import",
        message: `Registered book ${discovered.fileName} (${discovered.sourceKind})`,
        level: "info",
      });

      return manifest;
    },
  };
}

export type BookService = ReturnType<typeof createBookService>;
