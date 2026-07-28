import { NextResponse } from "next/server";

import { requireStaffPermission } from "@/features/admin/http";
import { getAdminEngine } from "@/features/admin/server";
import type { PageExtraction } from "@/features/knowledge/types";

export async function GET(request: Request) {
  const gate = await requireStaffPermission(request, "extraction.view");
  if (!gate.ok) return gate.response;

  const url = new URL(request.url);
  const bookSlug = url.searchParams.get("bookSlug");
  const pageNumber = Number(url.searchParams.get("page") ?? "");

  if (!bookSlug || Number.isNaN(pageNumber)) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INVALID_QUERY",
          message: "bookSlug and page are required",
        },
      },
      { status: 400 },
    );
  }

  const extraction = await getAdminEngine().knowledge.repo.getExtraction(
    bookSlug,
    pageNumber,
  );
  const verifications = (
    await getAdminEngine().knowledge.verification.list(bookSlug)
  ).filter((item) => item.pageNumber === pageNumber);
  const versions = extraction
    ? await getAdminEngine().versions.list(bookSlug, "PAGE", extraction.id)
    : [];

  return NextResponse.json({
    success: true,
    data: { extraction, verifications, versions },
    message: "",
    timestamp: new Date().toISOString(),
  });
}

export async function PATCH(request: Request) {
  const gate = await requireStaffPermission(request, "extraction.edit");
  if (!gate.ok) return gate.response;

  const body = (await request.json()) as {
    bookSlug?: string;
    pageNumber?: number;
    patch?: Partial<PageExtraction>;
    note?: string;
  };

  if (!body.bookSlug || typeof body.pageNumber !== "number" || !body.patch) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INVALID_BODY",
          message: "bookSlug, pageNumber, and patch are required",
        },
      },
      { status: 400 },
    );
  }

  const result = await getAdminEngine().admin.editExtraction({
    bookSlug: body.bookSlug,
    pageNumber: body.pageNumber,
    patch: body.patch,
    actor: gate.actor,
    note: body.note,
  });

  return NextResponse.json({
    success: true,
    data: result,
    message: "Extraction updated",
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: Request) {
  const gate = await requireStaffPermission(request, "extraction.rerun");
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

  const result = await getAdminEngine().knowledge.extraction.extractPage(
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

  return NextResponse.json({
    success: true,
    data: result,
    message: "Extraction re-run",
    timestamp: new Date().toISOString(),
  });
}
