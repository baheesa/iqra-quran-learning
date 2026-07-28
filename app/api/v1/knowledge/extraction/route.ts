import { requireStaffPermission } from "@/features/admin/http";
import { getAdminEngine } from "@/features/admin/server";
import { apiError, apiSuccess } from "@/lib/api/errors";

export async function GET(request: Request) {
  const gate = await requireStaffPermission(request, "extraction.view");
  if (!gate.ok) return gate.response;

  const { searchParams } = new URL(request.url);
  const bookSlug = searchParams.get("bookSlug");

  if (!bookSlug) {
    return apiError("MISSING_BOOK", "bookSlug is required", 400, { log: false });
  }

  const results = await getAdminEngine().knowledge.extraction.list(bookSlug);
  return apiSuccess(results);
}

export async function POST(request: Request) {
  const gate = await requireStaffPermission(request, "extraction.rerun");
  if (!gate.ok) return gate.response;

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
    const result = await knowledge.extraction.extractPage(
      body.bookSlug,
      body.pageNumber,
    );
    await getAdminEngine().audit.record({
      actor: gate.actor,
      action: "EXTRACTION_RUN",
      bookSlug: body.bookSlug,
      objectType: "PAGE",
      objectId: result.id,
    });
    return apiSuccess(result, "Extraction complete");
  }

  const results = await knowledge.extraction.extractBook(body.bookSlug, {
    maxPages: body.maxPages,
  });
  await getAdminEngine().audit.record({
    actor: gate.actor,
    action: "EXTRACTION_RUN",
    bookSlug: body.bookSlug,
    objectType: "BOOK",
    objectId: body.bookSlug,
  });

  return apiSuccess(results, "Extraction batch complete");
}
