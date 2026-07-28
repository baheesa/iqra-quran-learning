import { requireStaffPermission } from "@/features/admin/http";
import { getAdminEngine } from "@/features/admin/server";
import type { KnowledgeVerificationStatus } from "@/features/knowledge/types";
import { apiError, apiSuccess, publicErrorMessage } from "@/lib/api/errors";

export async function GET(request: Request) {
  const gate = await requireStaffPermission(request, "extraction.view");
  if (!gate.ok) return gate.response;

  const { searchParams } = new URL(request.url);
  const bookSlug = searchParams.get("bookSlug");

  if (!bookSlug) {
    return apiError("MISSING_BOOK", "bookSlug is required", 400, { log: false });
  }

  const records = await getAdminEngine().knowledge.verification.list(bookSlug);
  return apiSuccess(records);
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    bookSlug?: string;
    pageNumber?: number;
    objectType?: "PAGE" | "LESSON" | "VOCABULARY" | "RULE" | "EXERCISE";
    objectId?: string;
    status?: KnowledgeVerificationStatus;
    note?: string;
  };

  const permission =
    body.status === "APPROVED"
      ? "knowledge.approve"
      : body.status === "REJECTED"
        ? "knowledge.reject"
        : "extraction.edit";

  const gate = await requireStaffPermission(request, permission);
  if (!gate.ok) return gate.response;

  if (
    !body.bookSlug ||
    typeof body.pageNumber !== "number" ||
    !body.objectType ||
    !body.objectId ||
    !body.status
  ) {
    return apiError(
      "INVALID_BODY",
      "bookSlug, pageNumber, objectType, objectId, and status are required",
      400,
      { log: false },
    );
  }

  try {
    const record = await getAdminEngine().knowledge.verification.setStatus({
      bookSlug: body.bookSlug,
      pageNumber: body.pageNumber,
      objectType: body.objectType,
      objectId: body.objectId,
      status: body.status,
      note: body.note,
    });

    return apiSuccess(record, "Verification updated");
  } catch (error) {
    return apiError(
      "VERIFICATION_FAILED",
      publicErrorMessage(error, "Verification update failed"),
      400,
      { cause: error },
    );
  }
}
