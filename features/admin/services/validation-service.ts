import type { AdminStore } from "@/features/admin/repository/types";
import type {
  ValidationIssue,
  ValidationReport,
} from "@/features/admin/types";
import type { KnowledgeEngine } from "@/features/knowledge/create-engine";

export function createKnowledgeValidationService(
  knowledge: KnowledgeEngine,
  store: AdminStore,
) {
  return {
    async validateBook(bookSlug: string): Promise<ValidationReport> {
      const status = await knowledge.knowledgeBase.getBookStatus(bookSlug);
      const issues: ValidationIssue[] = [];

      if (!status) {
        issues.push({
          code: "BROKEN_REFERENCE",
          severity: "error",
          message: `Book ${bookSlug} is not registered`,
          bookSlug,
        });
        const report: ValidationReport = {
          bookSlug,
          ok: false,
          checkedAt: new Date().toISOString(),
          issues,
        };
        await store.saveValidationReport(report);
        return report;
      }

      const pages = new Set(status.pages.map((item) => item.pageNumber));
      const approved = status.extracted.filter(
        (item) => item.verificationStatus === "APPROVED",
      );

      if (approved.length === 0) {
        issues.push({
          code: "MISSING_LESSON",
          severity: "error",
          message: "No APPROVED pages available to publish",
          bookSlug,
        });
      }

      const vocabSeen = new Map<string, string>();
      const ruleSeen = new Map<string, string>();

      for (const page of approved) {
        if (!pages.has(page.pageNumber)) {
          issues.push({
            code: "INVALID_PAGE_LINK",
            severity: "error",
            message: `Extraction references missing page ${page.pageNumber}`,
            bookSlug,
            pageNumber: page.pageNumber,
            objectId: page.id,
          });
        }

        if (page.lessons.length === 0 && page.vocabulary.length === 0) {
          issues.push({
            code: "MISSING_LESSON",
            severity: "warning",
            message: `Approved page ${page.pageNumber} has no lessons or vocabulary`,
            bookSlug,
            pageNumber: page.pageNumber,
            objectId: page.id,
          });
        }

        for (const lesson of page.lessons) {
          if (!lesson.page || !pages.has(lesson.page)) {
            issues.push({
              code: "MISSING_REFERENCE",
              severity: "error",
              message: `Lesson ${lesson.id} has invalid page reference`,
              bookSlug,
              pageNumber: page.pageNumber,
              objectId: lesson.id,
            });
          }
        }

        for (const vocab of page.vocabulary) {
          const key = vocab.arabic.trim();
          if (!key) {
            issues.push({
              code: "MISSING_REFERENCE",
              severity: "error",
              message: `Vocabulary ${vocab.id} missing Arabic text`,
              bookSlug,
              pageNumber: page.pageNumber,
              objectId: vocab.id,
            });
            continue;
          }
          const prior = vocabSeen.get(key);
          if (prior && prior !== vocab.id) {
            issues.push({
              code: "DUPLICATE_VOCABULARY",
              severity: "error",
              message: `Duplicate vocabulary "${key}"`,
              bookSlug,
              pageNumber: page.pageNumber,
              objectId: vocab.id,
            });
          } else {
            vocabSeen.set(key, vocab.id);
          }
          if (!pages.has(vocab.page)) {
            issues.push({
              code: "INVALID_PAGE_LINK",
              severity: "error",
              message: `Vocabulary ${vocab.id} links to missing page ${vocab.page}`,
              bookSlug,
              pageNumber: vocab.page,
              objectId: vocab.id,
            });
          }
        }

        for (const rule of page.rules) {
          const key = rule.title.trim().toLowerCase();
          if (!key) {
            issues.push({
              code: "MISSING_REFERENCE",
              severity: "error",
              message: `Rule ${rule.id} missing title`,
              bookSlug,
              pageNumber: page.pageNumber,
              objectId: rule.id,
            });
            continue;
          }
          const prior = ruleSeen.get(key);
          if (prior && prior !== rule.id) {
            issues.push({
              code: "DUPLICATE_RULE",
              severity: "error",
              message: `Duplicate rule "${rule.title}"`,
              bookSlug,
              pageNumber: page.pageNumber,
              objectId: rule.id,
            });
          } else {
            ruleSeen.set(key, rule.id);
          }
        }

        for (const exercise of page.exercises) {
          if (exercise.page && !pages.has(exercise.page)) {
            issues.push({
              code: "BROKEN_REFERENCE",
              severity: "error",
              message: `Exercise ${exercise.id} has broken page link`,
              bookSlug,
              pageNumber: exercise.page,
              objectId: exercise.id,
            });
          }
        }
      }

      const report: ValidationReport = {
        bookSlug,
        ok: issues.filter((item) => item.severity === "error").length === 0,
        checkedAt: new Date().toISOString(),
        issues,
      };
      await store.saveValidationReport(report);
      return report;
    },

    getReport(bookSlug: string) {
      return store.getValidationReport(bookSlug);
    },
  };
}

export type KnowledgeValidationService = ReturnType<
  typeof createKnowledgeValidationService
>;
