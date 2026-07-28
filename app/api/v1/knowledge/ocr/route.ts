import { requireStaffPermission } from "@/features/admin/http";
import { getAdminEngine } from "@/features/admin/server";
import { isOcrEnabled } from "@/features/knowledge/providers/ocr-enabled";
import { apiError, apiSuccess } from "@/lib/api/errors";

export async function GET(request: Request) {
  const gate = await requireStaffPermission(request, "ocr.view");
  if (!gate.ok) return gate.response;

  const { searchParams } = new URL(request.url);
  const bookSlug = searchParams.get("bookSlug");

  if (!bookSlug) {
    return apiError("MISSING_BOOK", "bookSlug is required", 400, { log: false });
  }

  const results = await getAdminEngine().knowledge.ocr.list(bookSlug);
  return apiSuccess(results);
}

export async function POST(request: Request) {
  const gate = await requireStaffPermission(request, "ocr.rerun");
  if (!gate.ok) return gate.response;

  if (!isOcrEnabled()) {
    return apiError(
      "OCR_DISABLED",
      "Vision OCR is inactive. TXT is the primary knowledge source. Set OCR_ENABLED=1 only for Future OCR Import.",
      400,
      { log: false },
    );
  }

  const body = (await request.json()) as {
    bookSlug?: string;
    pageNumber?: number;
    maxPages?: number;
  };

  if (!body.bookSlug) {
    return apiError("MISSING_BOOK", "bookSlug is required", 400, { log: false });
  }

  const knowledge = getAdminEngine().knowledge;

  if (typeof body.pageNumber === "number") {
    const result = await knowledge.ocr.runPage(body.bookSlug, body.pageNumber);
    await getAdminEngine().audit.record({
      actor: gate.actor,
      action: "OCR_RUN",
      bookSlug: body.bookSlug,
      objectType: "OCR",
      objectId: `${body.bookSlug}:p${body.pageNumber}`,
    });
    return apiSuccess(result, "OCR complete");
  }

  const results = await knowledge.ocr.runBook(body.bookSlug, {
    maxPages: body.maxPages,
  });
  await getAdminEngine().audit.record({
    actor: gate.actor,
    action: "OCR_RUN",
    bookSlug: body.bookSlug,
    objectType: "BOOK",
    objectId: body.bookSlug,
  });

  return apiSuccess(results, "OCR batch complete");
}
