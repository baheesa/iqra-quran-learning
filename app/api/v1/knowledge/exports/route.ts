import { requireStaffPermission } from "@/features/admin/http";
import { getAdminEngine } from "@/features/admin/server";
import { apiError, apiSuccess } from "@/lib/api/errors";

export async function GET(request: Request) {
  const gate = await requireStaffPermission(request, "books.browse");
  if (!gate.ok) return gate.response;

  const { searchParams } = new URL(request.url);
  const bookSlug = searchParams.get("bookSlug");

  if (!bookSlug) {
    return apiError("MISSING_BOOK", "bookSlug is required", 400, { log: false });
  }

  const bundle = await getAdminEngine().knowledge.export.get(bookSlug);
  return apiSuccess(bundle);
}

export async function POST(request: Request) {
  const gate = await requireStaffPermission(request, "knowledge.publish");
  if (!gate.ok) return gate.response;

  const body = (await request.json()) as { bookSlug?: string };

  if (!body.bookSlug) {
    return apiError("MISSING_BOOK", "bookSlug is required", 400, { log: false });
  }

  const bundle = await getAdminEngine().knowledge.export.exportApproved(
    body.bookSlug,
  );
  return apiSuccess(bundle, "Approved knowledge exported");
}
