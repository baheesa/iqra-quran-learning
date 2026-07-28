import { NextResponse } from "next/server";

import { requireStaffPermission } from "@/features/admin/http";
import { getAdminEngine } from "@/features/admin/server";

export async function GET(request: Request) {
  const gate = await requireStaffPermission(request, "books.browse");
  if (!gate.ok) return gate.response;

  const url = new URL(request.url);
  const bookSlug = url.searchParams.get("bookSlug") ?? undefined;
  const publications = await getAdminEngine().publication.list(bookSlug);

  return NextResponse.json({
    success: true,
    data: publications,
    message: "",
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: Request) {
  const gate = await requireStaffPermission(request, "knowledge.publish");
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

  const result = await getAdminEngine().publication.publish({
    bookSlug: body.bookSlug,
    actor: gate.actor,
  });

  return NextResponse.json(
    {
      success: result.ok,
      data: result.publication,
      message: result.ok
        ? "Knowledge published"
        : "Validation failed — not published",
      timestamp: new Date().toISOString(),
    },
    { status: result.ok ? 200 : 422 },
  );
}
