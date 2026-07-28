import { requireStaffPermission } from "@/features/admin/http";
import { getAdminEngine } from "@/features/admin/server";
import { isOcrEnabled } from "@/features/knowledge/providers/ocr-enabled";
import { apiError, apiSuccess } from "@/lib/api/errors";

export async function GET(request: Request) {
  const gate = await requireStaffPermission(request, "books.browse");
  if (!gate.ok) return gate.response;

  const { searchParams } = new URL(request.url);
  const bookSlug = searchParams.get("bookSlug");

  if (!bookSlug) {
    return apiError("MISSING_BOOK", "bookSlug is required", 400, { log: false });
  }

  const pages = await getAdminEngine().knowledge.repo.listPages(bookSlug);
  return apiSuccess(pages);
}

export async function POST(request: Request) {
  const gate = await requireStaffPermission(request, "books.reprocess");
  if (!gate.ok) return gate.response;

  if (!isOcrEnabled()) {
    return apiError(
      "PDF_RASTER_DISABLED",
      "PDF page raster is Future OCR Import only. Use TXT import (pnpm knowledge:import).",
      400,
      { log: false },
    );
  }

  const body = (await request.json()) as {
    bookSlug?: string;
    maxPages?: number;
  };

  if (!body.bookSlug) {
    return apiError("MISSING_BOOK", "bookSlug is required", 400, { log: false });
  }

  const pages = await getAdminEngine().knowledge.images.extractPages(
    body.bookSlug,
    { maxPages: body.maxPages },
  );

  return apiSuccess(pages, "Pages extracted");
}
