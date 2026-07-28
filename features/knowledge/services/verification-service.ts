import { randomUUID } from "crypto";

import type { FileKnowledgeRepository } from "@/features/knowledge/repository/file-repository";
import type {
  KnowledgeVerificationStatus,
  VerificationRecord,
} from "@/features/knowledge/types";

const ALLOWED: Record<
  KnowledgeVerificationStatus,
  KnowledgeVerificationStatus[]
> = {
  PENDING: ["NEEDS_REVIEW", "VERIFIED", "APPROVED", "REJECTED"],
  NEEDS_REVIEW: ["VERIFIED", "APPROVED", "PENDING", "REJECTED"],
  VERIFIED: ["APPROVED", "NEEDS_REVIEW", "REJECTED"],
  APPROVED: ["VERIFIED", "REJECTED"],
  REJECTED: ["PENDING", "NEEDS_REVIEW"],
};

export type ApprovalOptions = {
  note?: string;
  approvedBy?: string;
  approvedAt?: string;
  approvalReason?: string;
};

/**
 * VerificationEngine — approve/reject extracted knowledge.
 * Only APPROVED data may be exported.
 */
export function createVerificationEngine(repo: FileKnowledgeRepository) {
  async function setStatus(input: {
    bookSlug: string;
    pageNumber: number;
    objectType: VerificationRecord["objectType"];
    objectId: string;
    status: KnowledgeVerificationStatus;
    note?: string;
    approvedBy?: string | null;
    approvedAt?: string | null;
    approvalReason?: string | null;
  }): Promise<VerificationRecord> {
    const existing = (await repo.listVerifications(input.bookSlug)).find(
      (item) =>
        item.objectId === input.objectId &&
        item.objectType === input.objectType,
    );

    if (existing && existing.status === input.status) {
      const record: VerificationRecord = {
        ...existing,
        note: input.note ?? existing.note,
        updatedAt: new Date().toISOString(),
        approvedBy:
          input.status === "APPROVED"
            ? (input.approvedBy ?? existing.approvedBy ?? null)
            : null,
        approvedAt:
          input.status === "APPROVED"
            ? (input.approvedAt ?? existing.approvedAt ?? new Date().toISOString())
            : null,
        approvalReason:
          input.status === "APPROVED"
            ? (input.approvalReason ?? existing.approvalReason ?? null)
            : null,
      };
      await repo.saveVerification(record);

      if (input.objectType === "PAGE") {
        const extraction = await repo.getExtraction(
          input.bookSlug,
          input.pageNumber,
        );
        if (extraction && extraction.verificationStatus !== input.status) {
          await repo.saveExtraction({
            ...extraction,
            verificationStatus: input.status,
            lessons: extraction.lessons.map((item) => ({
              ...item,
              verificationStatus: input.status,
              verified: input.status === "APPROVED",
            })),
            vocabulary: extraction.vocabulary.map((item) => ({
              ...item,
              verificationStatus: input.status,
              verified: input.status === "APPROVED",
            })),
            rules: extraction.rules.map((item) => ({
              ...item,
              verificationStatus: input.status,
              verified: input.status === "APPROVED",
            })),
            exercises: extraction.exercises.map((item) => ({
              ...item,
              verificationStatus: input.status,
              verified: input.status === "APPROVED",
            })),
          });
        }
      }

      return record;
    }

    if (existing && !ALLOWED[existing.status].includes(input.status)) {
      throw new Error(
        `Cannot transition verification from ${existing.status} to ${input.status}`,
      );
    }

    const record: VerificationRecord = {
      id: existing?.id ?? randomUUID(),
      bookSlug: input.bookSlug,
      pageNumber: input.pageNumber,
      objectType: input.objectType,
      objectId: input.objectId,
      status: input.status,
      note: input.note ?? null,
      updatedAt: new Date().toISOString(),
      approvedBy:
        input.status === "APPROVED"
          ? (input.approvedBy ?? existing?.approvedBy ?? null)
          : null,
      approvedAt:
        input.status === "APPROVED"
          ? (input.approvedAt ??
            existing?.approvedAt ??
            new Date().toISOString())
          : null,
      approvalReason:
        input.status === "APPROVED"
          ? (input.approvalReason ?? existing?.approvalReason ?? null)
          : null,
    };

    await repo.saveVerification(record);

    if (input.objectType === "PAGE") {
      const extraction = await repo.getExtraction(
        input.bookSlug,
        input.pageNumber,
      );
      if (extraction) {
        await repo.saveExtraction({
          ...extraction,
          verificationStatus: input.status,
          lessons: extraction.lessons.map((item) => ({
            ...item,
            verificationStatus: input.status,
            verified: input.status === "APPROVED",
          })),
          vocabulary: extraction.vocabulary.map((item) => ({
            ...item,
            verificationStatus: input.status,
            verified: input.status === "APPROVED",
          })),
          rules: extraction.rules.map((item) => ({
            ...item,
            verificationStatus: input.status,
            verified: input.status === "APPROVED",
          })),
          exercises: extraction.exercises.map((item) => ({
            ...item,
            verificationStatus: input.status,
            verified: input.status === "APPROVED",
          })),
        });
      }
    }

    const manifest = await repo.getManifest(input.bookSlug);
    if (manifest) {
      if (input.status === "APPROVED") {
        await repo.saveManifest({
          ...manifest,
          status: "APPROVED",
          updatedAt: new Date().toISOString(),
        });
      } else if (input.status === "VERIFIED") {
        await repo.saveManifest({
          ...manifest,
          status: "VERIFIED",
          updatedAt: new Date().toISOString(),
        });
      } else if (input.status === "REJECTED") {
        await repo.saveManifest({
          ...manifest,
          status: "FAILED",
          updatedAt: new Date().toISOString(),
        });
      }
    }

    await repo.appendLog({
      bookSlug: input.bookSlug,
      stage: "verification",
      message: `${input.objectType} ${input.objectId} → ${input.status}`,
      level: input.status === "REJECTED" ? "warn" : "info",
      meta: {
        approvedBy: record.approvedBy ?? undefined,
        approvedAt: record.approvedAt ?? undefined,
        approvalReason: record.approvalReason ?? undefined,
      },
    });

    return record;
  }

  function parseApprovalOptions(
    noteOrOptions?: string | ApprovalOptions,
  ): ApprovalOptions {
    if (typeof noteOrOptions === "string") {
      return { note: noteOrOptions };
    }
    return noteOrOptions ?? {};
  }

  return {
    setStatus,

    approvePage(
      bookSlug: string,
      pageNumber: number,
      noteOrOptions?: string | ApprovalOptions,
    ) {
      const options = parseApprovalOptions(noteOrOptions);
      return setStatus({
        bookSlug,
        pageNumber,
        objectType: "PAGE",
        objectId: `${bookSlug}:p${pageNumber}:extraction`,
        status: "APPROVED",
        note: options.note,
        approvedBy: options.approvedBy,
        approvedAt: options.approvedAt,
        approvalReason: options.approvalReason,
      });
    },

    rejectPage(bookSlug: string, pageNumber: number, note?: string) {
      return setStatus({
        bookSlug,
        pageNumber,
        objectType: "PAGE",
        objectId: `${bookSlug}:p${pageNumber}:extraction`,
        status: "REJECTED",
        note,
      });
    },

    list(bookSlug: string) {
      return repo.listVerifications(bookSlug);
    },

    async listApprovedPages(bookSlug: string) {
      const extracted = await repo.listExtracted(bookSlug);
      return extracted.filter((item) => item.verificationStatus === "APPROVED");
    },
  };
}

export type VerificationEngine = ReturnType<typeof createVerificationEngine>;

/** @deprecated Use createVerificationEngine */
export const createVerificationService = createVerificationEngine;
export type VerificationService = VerificationEngine;
