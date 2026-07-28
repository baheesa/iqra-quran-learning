import { NextResponse } from "next/server";

import { requireStaffPermission } from "@/features/admin/http";
import { getAdminEngine } from "@/features/admin/server";
import type { PageExtraction } from "@/features/knowledge/types";

export async function GET(request: Request) {
  const gate = await requireStaffPermission(request, "versions.view");
  if (!gate.ok) return gate.response;

  const url = new URL(request.url);
  const bookSlug = url.searchParams.get("bookSlug");
  const objectType = url.searchParams.get("objectType");
  const objectId = url.searchParams.get("objectId");

  if (!bookSlug || !objectType || !objectId) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INVALID_QUERY",
          message: "bookSlug, objectType, and objectId are required",
        },
      },
      { status: 400 },
    );
  }

  const versions = await getAdminEngine().versions.list(
    bookSlug,
    objectType,
    objectId,
  );
  return NextResponse.json({
    success: true,
    data: versions,
    message: "",
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: Request) {
  const gate = await requireStaffPermission(request, "versions.rollback");
  if (!gate.ok) return gate.response;

  const body = (await request.json()) as {
    bookSlug?: string;
    objectType?: string;
    objectId?: string;
    version?: number;
    applyToPage?: boolean;
  };

  if (
    !body.bookSlug ||
    !body.objectType ||
    !body.objectId ||
    typeof body.version !== "number"
  ) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INVALID_BODY",
          message: "bookSlug, objectType, objectId, and version are required",
        },
      },
      { status: 400 },
    );
  }

  const restored = await getAdminEngine().versions.rollback({
    bookSlug: body.bookSlug,
    objectType: body.objectType,
    objectId: body.objectId,
    version: body.version,
    actor: gate.actor,
  });

  if (body.applyToPage && body.objectType === "PAGE") {
    const payload = restored.payload as PageExtraction;
    await getAdminEngine().knowledge.repo.saveExtraction({
      ...payload,
      verificationStatus: "NEEDS_REVIEW",
    });
  }

  return NextResponse.json({
    success: true,
    data: restored,
    message: "Version rolled back",
    timestamp: new Date().toISOString(),
  });
}
