import { NextResponse } from "next/server";

import { requireStaffPermission } from "@/features/admin/http";
import { getAdminEngine } from "@/features/admin/server";

export async function GET(request: Request) {
  const gate = await requireStaffPermission(request, "knowledge.search");
  if (!gate.ok) return gate.response;

  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? "";
  const hits = await getAdminEngine().search.search(q);

  return NextResponse.json({
    success: true,
    data: hits,
    message: "",
    timestamp: new Date().toISOString(),
  });
}
