import { NextResponse } from "next/server";

import { requireStaffPermission } from "@/features/admin/http";
import { getAdminEngine } from "@/features/admin/server";

export async function POST(request: Request) {
  const gate = await requireStaffPermission(request, "knowledge.reject");
  if (!gate.ok) return gate.response;

  const body = (await request.json()) as {
    bookSlug?: string;
    pageNumber?: number;
    note?: string;
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
    const record = await getAdminEngine().admin.rejectPage({
      bookSlug: body.bookSlug,
      pageNumber: body.pageNumber,
      actor: gate.actor,
      note: body.note,
    });
    return NextResponse.json({
      success: true,
      data: record,
      message: "Page rejected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "REJECT_FAILED",
          message: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 400 },
    );
  }
}
