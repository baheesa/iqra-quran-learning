import { NextResponse } from "next/server";

import { requireStaffPermission } from "@/features/admin/http";
import { getAdminEngine } from "@/features/admin/server";

export async function POST(request: Request) {
  const gate = await requireStaffPermission(request, "books.reprocess");
  if (!gate.ok) return gate.response;

  const body = (await request.json()) as {
    bookSlug?: string;
    pageNumber?: number;
  };

  if (!body.bookSlug || typeof body.pageNumber !== "number") {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INVALID_BODY",
          message: "bookSlug and pageNumber are required",
        },
      },
      { status: 400 },
    );
  }

  try {
    const result = await getAdminEngine().knowledge.importer.reprocessPage(
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
    return NextResponse.json({
      success: true,
      data: result,
      message: "Page reprocessed",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "REPROCESS_FAILED",
          message: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 400 },
    );
  }
}
