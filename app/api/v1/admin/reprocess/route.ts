import { NextResponse } from "next/server";

import { requireStaffPermission } from "@/features/admin/http";
import { getAdminEngine } from "@/features/admin/server";
import { isOcrEnabled } from "@/features/knowledge/providers/ocr-enabled";

export async function POST(request: Request) {
  const gate = await requireStaffPermission(request, "books.reprocess");
  if (!gate.ok) return gate.response;

  const body = (await request.json()) as {
    bookSlug?: string;
    pageNumber?: number;
    stages?: Array<"pages" | "ocr" | "extraction">;
  };

  if (!body.bookSlug) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "INVALID_BODY", message: "bookSlug is required" },
      },
      { status: 400 },
    );
  }

  const knowledge = getAdminEngine().knowledge;
  // Default: extraction only (TXT primary). OCR/pages only when explicitly requested + enabled.
  const stages = body.stages ?? ["extraction"];
  const result: Record<string, unknown> = {};

  if (typeof body.pageNumber === "number") {
    if (stages.includes("ocr") && !isOcrEnabled()) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "OCR_DISABLED",
            message:
              "OCR stage requested but OCR_ENABLED is off. TXT is primary.",
          },
        },
        { status: 400 },
      );
    }
    if (stages.includes("ocr") || stages.includes("extraction")) {
      result.page = await knowledge.importer.reprocessPage(
        body.bookSlug,
        body.pageNumber,
      );
      await getAdminEngine().audit.record({
        actor: gate.actor,
        action: "EXTRACTION_RUN",
        bookSlug: body.bookSlug,
        objectType: "PAGE",
        objectId: `${body.bookSlug}:p${body.pageNumber}`,
      });
    }
  } else {
    if (stages.includes("pages")) {
      if (!isOcrEnabled()) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "PDF_RASTER_DISABLED",
              message:
                "PDF page raster is part of Future OCR Import. Use TXT import instead.",
            },
          },
          { status: 400 },
        );
      }
      result.pages = await knowledge.images.extractPages(body.bookSlug);
    }
    if (stages.includes("ocr")) {
      if (!isOcrEnabled()) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "OCR_DISABLED",
              message:
                "OCR stage requested but OCR_ENABLED is off. TXT is primary.",
            },
          },
          { status: 400 },
        );
      }
      result.ocr = await knowledge.ocr.runBook(body.bookSlug);
      await getAdminEngine().audit.record({
        actor: gate.actor,
        action: "OCR_RUN",
        bookSlug: body.bookSlug,
        objectType: "BOOK",
        objectId: body.bookSlug,
      });
    }
    if (stages.includes("extraction")) {
      result.extraction = await knowledge.extraction.extractBook(body.bookSlug);
      await getAdminEngine().audit.record({
        actor: gate.actor,
        action: "EXTRACTION_RUN",
        bookSlug: body.bookSlug,
        objectType: "BOOK",
        objectId: body.bookSlug,
      });
    }
  }

  return NextResponse.json({
    success: true,
    data: result,
    message: "Reprocess complete",
    timestamp: new Date().toISOString(),
  });
}
