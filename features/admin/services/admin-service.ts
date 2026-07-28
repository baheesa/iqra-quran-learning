import type { AuditLogService } from "@/features/admin/services/audit-log-service";
import type { KnowledgeValidationService } from "@/features/admin/services/validation-service";
import type { PublicationService } from "@/features/admin/services/publication-service";
import type { RoleService } from "@/features/admin/services/role-service";
import type { VersionService } from "@/features/admin/services/version-service";
import type { AdminStore } from "@/features/admin/repository/types";
import type {
  AdminDashboardStats,
  KnowledgeSearchHit,
  OcrReviewStatus,
  StaffActor,
} from "@/features/admin/types";
import type { KnowledgeEngine } from "@/features/knowledge/create-engine";
import type { PageExtraction } from "@/features/knowledge/types";
import { copyFile, mkdir, access } from "fs/promises";
import path from "path";
import { constants } from "fs";

export function createSearchService(knowledge: KnowledgeEngine) {
  return {
    async search(query: string): Promise<KnowledgeSearchHit[]> {
      const q = query.trim().toLowerCase();
      if (!q) return [];

      const manifests = await knowledge.books.list();
      const hits: KnowledgeSearchHit[] = [];

      for (const book of manifests) {
        if (
          book.slug.toLowerCase().includes(q) ||
          book.title.toLowerCase().includes(q) ||
          (book.unitNumber !== null && String(book.unitNumber) === q)
        ) {
          hits.push({
            kind: book.unitNumber !== null && String(book.unitNumber) === q
              ? "unit"
              : "book",
            bookSlug: book.slug,
            pageNumber: null,
            title: book.title,
            snippet: `Unit ${book.unitNumber ?? "—"} · ${book.status}`,
            objectId: book.id,
            verificationStatus: book.status,
          });
        }

        const extracted = await knowledge.repo.listExtracted(book.slug);
        for (const page of extracted) {
          if (String(page.pageNumber) === q || `p${page.pageNumber}` === q) {
            hits.push({
              kind: "page",
              bookSlug: book.slug,
              pageNumber: page.pageNumber,
              title: `Page ${page.pageNumber}`,
              snippet: page.verificationStatus,
              objectId: page.id,
              verificationStatus: page.verificationStatus,
            });
          }

          for (const lesson of page.lessons) {
            const hay = `${lesson.title ?? ""} ${lesson.objectives.join(" ")}`.toLowerCase();
            if (hay.includes(q) || String(lesson.lessonNumber ?? "") === q) {
              hits.push({
                kind: "lesson",
                bookSlug: book.slug,
                pageNumber: page.pageNumber,
                title: lesson.title ?? `Lesson ${lesson.lessonNumber ?? "?"}`,
                snippet: lesson.objectives.slice(0, 2).join(" · "),
                objectId: lesson.id,
                verificationStatus: lesson.verificationStatus,
              });
            }
          }

          for (const vocab of page.vocabulary) {
            const hay = `${vocab.arabic} ${vocab.urdu ?? ""}`.toLowerCase();
            if (hay.includes(q)) {
              hits.push({
                kind: hay.includes(q) && /[\u0600-\u06FF]/.test(q)
                  ? "quran_word"
                  : "vocabulary",
                bookSlug: book.slug,
                pageNumber: page.pageNumber,
                title: vocab.arabic,
                snippet: vocab.urdu ?? "",
                objectId: vocab.id,
                verificationStatus: vocab.verificationStatus,
              });
            }
          }

          for (const rule of page.rules) {
            const hay = `${rule.title} ${rule.explanation ?? ""}`.toLowerCase();
            if (hay.includes(q)) {
              hits.push({
                kind: "rule",
                bookSlug: book.slug,
                pageNumber: page.pageNumber,
                title: rule.title,
                snippet: rule.explanation?.slice(0, 120) ?? "",
                objectId: rule.id,
                verificationStatus: rule.verificationStatus,
              });
            }
          }

          for (const exercise of page.exercises) {
            const hay = `${exercise.question} ${exercise.answer ?? ""}`.toLowerCase();
            if (hay.includes(q)) {
              hits.push({
                kind: "exercise",
                bookSlug: book.slug,
                pageNumber: page.pageNumber,
                title: exercise.question.slice(0, 80),
                snippet: exercise.exerciseType ?? "",
                objectId: exercise.id,
                verificationStatus: exercise.verificationStatus,
              });
            }
          }
        }
      }

      return hits.slice(0, 100);
    },
  };
}

export type SearchService = ReturnType<typeof createSearchService>;

export function createAdminService(deps: {
  knowledge: KnowledgeEngine;
  store: AdminStore;
  roles: RoleService;
  audit: AuditLogService;
  versions: VersionService;
  validation: KnowledgeValidationService;
  publication: PublicationService;
  search: SearchService;
}) {
  const { knowledge, audit, versions, roles } = deps;

  return {
    roles,
    audit,
    versions,
    validation: deps.validation,
    publication: deps.publication,
    search: deps.search,

    async dashboard(): Promise<AdminDashboardStats> {
      const overview = await knowledge.knowledgeBase.listBooksOverview();
      const activity = await audit.list(20);
      let pagesProcessed = 0;
      let ocrDone = 0;
      let ocrTotal = 0;
      let extractionDone = 0;
      let approved = 0;
      let rejected = 0;
      let pending = 0;
      let published = 0;
      let archivedBooks = 0;

      for (const book of overview) {
        if (book.pipelineStatus === "ARCHIVED") archivedBooks += 1;
        const pages = book.counts?.pages ?? 0;
        pagesProcessed += pages;
        ocrTotal += pages;
        ocrDone += book.counts?.ocr ?? 0;
        extractionDone += book.counts?.extracted ?? 0;
        approved += book.counts?.approved ?? 0;
        const status = await knowledge.knowledgeBase.getBookStatus(book.slug);
        if (status) {
          rejected += status.verifications.filter(
            (item) => item.status === "REJECTED",
          ).length;
          pending += status.extracted.filter(
            (item) =>
              item.verificationStatus === "PENDING" ||
              item.verificationStatus === "NEEDS_REVIEW",
          ).length;
          if (status.export) published += 1;
        }
      }

      const lastValidation = overview[0]
        ? await deps.store.getValidationReport(overview[0].slug)
        : null;

      return {
        books: overview.length,
        archivedBooks,
        pagesProcessed,
        ocrProgress: { done: ocrDone, total: ocrTotal },
        extractionProgress: { done: extractionDone, total: ocrTotal },
        verificationProgress: { approved, rejected, pending },
        publishedKnowledge: published,
        pendingReviews: pending,
        recentActivity: activity,
        validationStatus: {
          lastOk: lastValidation?.ok ?? null,
          lastCheckedAt: lastValidation?.checkedAt ?? null,
          openErrors:
            lastValidation?.issues.filter((item) => item.severity === "error")
              .length ?? 0,
        },
      };
    },

    async uploadBook(input: {
      fileName: string;
      absoluteSourcePath: string;
      actor?: StaffActor | null;
    }) {
      if (!input.actor) {
        throw new Error("Staff actor required to import books");
      }
      roles.assert(input.actor, "books.import");
      const dest = path.join(knowledge.repo.dirs.original, input.fileName);
      try {
        await access(dest, constants.F_OK);
        throw new Error(
          `Original PDF already exists: ${input.fileName}. Never overwrite originals — use a new filename/version.`,
        );
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes("Never overwrite")
        ) {
          throw error;
        }
      }
      await mkdir(knowledge.repo.dirs.original, { recursive: true });
      await copyFile(input.absoluteSourcePath, dest);
      const discovered = (await knowledge.books.discover()).find(
        (item) => item.fileName === input.fileName,
      );
      if (!discovered) {
        throw new Error("Upload succeeded but book was not discovered");
      }
      const manifest = await knowledge.import.importOne(input.fileName);
      await audit.record({
        actor: input.actor,
        action: "BOOK_IMPORTED",
        bookSlug: manifest.slug,
        objectType: "BOOK",
        objectId: manifest.id,
        meta: { fileName: input.fileName },
      });
      return manifest;
    },

    async archiveBook(bookSlug: string, actor?: StaffActor | null) {
      if (actor) roles.assert(actor, "books.archive");
      const manifest = await knowledge.books.get(bookSlug);
      if (!manifest) throw new Error(`Book not found: ${bookSlug}`);
      const next = {
        ...manifest,
        status: "ARCHIVED" as const,
        updatedAt: new Date().toISOString(),
      };
      await knowledge.repo.saveManifest(next);
      await audit.record({
        actor,
        action: "BOOK_ARCHIVED",
        bookSlug,
        objectType: "BOOK",
        objectId: manifest.id,
      });
      return next;
    },

    async versionBook(bookSlug: string, actor?: StaffActor | null) {
      if (actor) roles.assert(actor, "books.import");
      const manifest = await knowledge.books.get(bookSlug);
      if (!manifest) throw new Error(`Book not found: ${bookSlug}`);
      const nextVersion = String(Number(manifest.version || "1") + 1);
      const next = {
        ...manifest,
        version: nextVersion,
        updatedAt: new Date().toISOString(),
      };
      await knowledge.repo.saveManifest(next);
      await versions.create({
        bookSlug,
        objectType: "BOOK",
        objectId: manifest.id,
        payload: next,
        actor,
        note: `Book version ${nextVersion}`,
      });
      await audit.record({
        actor,
        action: "BOOK_VERSIONED",
        bookSlug,
        objectType: "BOOK",
        objectId: manifest.id,
        meta: { version: nextVersion },
      });
      return next;
    },

    async setOcrReview(input: {
      bookSlug: string;
      pageNumber: number;
      status: OcrReviewStatus;
      actor?: StaffActor | null;
    }) {
      if (input.actor) roles.assert(input.actor, "ocr.accept");
      const ocr = await knowledge.repo.getOcrResult(
        input.bookSlug,
        input.pageNumber,
      );
      if (!ocr) throw new Error("OCR result not found");
      const next = { ...ocr, reviewStatus: input.status };
      await knowledge.repo.saveOcrResult(next);
      await audit.record({
        actor: input.actor,
        action:
          input.status === "ACCEPTED" ? "OCR_ACCEPTED" : "OCR_NEEDS_REVIEW",
        bookSlug: input.bookSlug,
        objectType: "OCR",
        objectId: `${input.bookSlug}:p${input.pageNumber}`,
        meta: { pageNumber: input.pageNumber, status: input.status },
      });
      return next;
    },

    async editExtraction(input: {
      bookSlug: string;
      pageNumber: number;
      patch: Partial<PageExtraction>;
      actor?: StaffActor | null;
      note?: string;
    }) {
      if (input.actor) roles.assert(input.actor, "extraction.edit");
      const existing = await knowledge.repo.getExtraction(
        input.bookSlug,
        input.pageNumber,
      );
      if (!existing) throw new Error("Extraction not found");

      const next: PageExtraction = {
        ...existing,
        ...input.patch,
        bookSlug: existing.bookSlug,
        pageNumber: existing.pageNumber,
        id: existing.id,
        verificationStatus: "NEEDS_REVIEW",
      };
      await knowledge.repo.saveExtraction(next);
      await versions.create({
        bookSlug: input.bookSlug,
        objectType: "PAGE",
        objectId: existing.id,
        payload: next,
        actor: input.actor,
        note: input.note ?? "Edited extraction",
      });
      await audit.record({
        actor: input.actor,
        action: "KNOWLEDGE_EDITED",
        bookSlug: input.bookSlug,
        objectType: "PAGE",
        objectId: existing.id,
        meta: { pageNumber: input.pageNumber },
      });
      return next;
    },

    async approvePage(input: {
      bookSlug: string;
      pageNumber: number;
      actor?: StaffActor | null;
      note?: string;
    }) {
      if (input.actor) roles.assert(input.actor, "knowledge.approve");
      const record = await knowledge.verification.approvePage(
        input.bookSlug,
        input.pageNumber,
        input.note,
      );
      const extraction = await knowledge.repo.getExtraction(
        input.bookSlug,
        input.pageNumber,
      );
      if (extraction) {
        await versions.create({
          bookSlug: input.bookSlug,
          objectType: "PAGE",
          objectId: extraction.id,
          payload: extraction,
          actor: input.actor,
          note: input.note ?? "Approved",
        });
      }
      await audit.record({
        actor: input.actor,
        action: "KNOWLEDGE_APPROVED",
        bookSlug: input.bookSlug,
        objectType: "PAGE",
        objectId: record.objectId,
        meta: { pageNumber: input.pageNumber },
      });
      return record;
    },

    async rejectPage(input: {
      bookSlug: string;
      pageNumber: number;
      actor?: StaffActor | null;
      note?: string;
    }) {
      if (input.actor) roles.assert(input.actor, "knowledge.reject");
      const record = await knowledge.verification.rejectPage(
        input.bookSlug,
        input.pageNumber,
        input.note,
      );
      await audit.record({
        actor: input.actor,
        action: "KNOWLEDGE_REJECTED",
        bookSlug: input.bookSlug,
        objectType: "PAGE",
        objectId: record.objectId,
        meta: { pageNumber: input.pageNumber, note: input.note },
      });
      return record;
    },
  };
}

export type AdminService = ReturnType<typeof createAdminService>;
