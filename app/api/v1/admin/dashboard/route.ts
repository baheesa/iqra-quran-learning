import { NextResponse } from "next/server";

import { requireStaffPermission } from "@/features/admin/http";
import { getAdminEngine } from "@/features/admin/server";

export async function GET(request: Request) {
  const gate = await requireStaffPermission(request, "books.browse");
  if (!gate.ok) return gate.response;

  const stats = await getAdminEngine().admin.dashboard();
  return NextResponse.json({
    success: true,
    data: stats,
    message: "",
    timestamp: new Date().toISOString(),
  });
}
