import { NextResponse } from "next/server";

import { requireStaffPermission } from "@/features/admin/http";
import { getAdminEngine } from "@/features/admin/server";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    bookSlug?: string;
    pageNumber?: number;
    decision?: "approve" | "reject";
    note?: string;
  };

  if (
    !body.bookSlug ||
    typeof body.pageNumber !== "number" ||
    !body.decision
  ) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INVALID_BODY",
          message: "bookSlug, pageNumber, and decision are required",
        },
      },
      { status: 400 },
    );
  }

  const permission =
    body.decision === "approve" ? "knowledge.approve" : "knowledge.reject";
  const gate = await requireStaffPermission(request, permission);
  if (!gate.ok) return gate.response;

  const admin = getAdminEngine().admin;
  const record =
    body.decision === "approve"
      ? await admin.approvePage({
          bookSlug: body.bookSlug,
          pageNumber: body.pageNumber,
          actor: gate.actor,
          note: body.note,
        })
      : await admin.rejectPage({
          bookSlug: body.bookSlug,
          pageNumber: body.pageNumber,
          actor: gate.actor,
          note: body.note,
        });

  return NextResponse.json({
    success: true,
    data: record,
    message: body.decision === "approve" ? "Approved" : "Rejected",
    timestamp: new Date().toISOString(),
  });
}
