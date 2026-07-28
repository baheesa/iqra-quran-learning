import { NextResponse } from "next/server";

import { requireStaffPermission } from "@/features/admin/http";
import { getAdminEngine } from "@/features/admin/server";

export async function GET(request: Request) {
  const gate = await requireStaffPermission(request, "validation.run");
  if (!gate.ok) return gate.response;

  const url = new URL(request.url);
  const bookSlug = url.searchParams.get("bookSlug");
  if (!bookSlug) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "INVALID_QUERY", message: "bookSlug is required" },
      },
      { status: 400 },
    );
  }

  const report = await getAdminEngine().validation.getReport(bookSlug);
  return NextResponse.json({
    success: true,
    data: report,
    message: "",
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: Request) {
  const gate = await requireStaffPermission(request, "validation.run");
  if (!gate.ok) return gate.response;

  const body = (await request.json()) as { bookSlug?: string };
  if (!body.bookSlug) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "INVALID_BODY", message: "bookSlug is required" },
      },
      { status: 400 },
    );
  }

  const report = await getAdminEngine().validation.validateBook(body.bookSlug);
  await getAdminEngine().audit.record({
    actor: gate.actor,
    action: "VALIDATION_RUN",
    bookSlug: body.bookSlug,
    objectType: "BOOK",
    objectId: body.bookSlug,
    meta: { ok: report.ok, issues: report.issues.length },
  });

  return NextResponse.json({
    success: true,
    data: report,
    message: report.ok ? "Validation passed" : "Validation found issues",
    timestamp: new Date().toISOString(),
  });
}
