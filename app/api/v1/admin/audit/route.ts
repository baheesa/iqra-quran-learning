import { NextResponse } from "next/server";

import { requireStaffPermission } from "@/features/admin/http";
import { getAdminEngine } from "@/features/admin/server";

export async function GET(request: Request) {
  const gate = await requireStaffPermission(request, "audit.view");
  if (!gate.ok) return gate.response;

  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? "100");
  const entries = await getAdminEngine().audit.list(
    Number.isFinite(limit) ? limit : 100,
  );

  return NextResponse.json({
    success: true,
    data: entries,
    message: "",
    timestamp: new Date().toISOString(),
  });
}
