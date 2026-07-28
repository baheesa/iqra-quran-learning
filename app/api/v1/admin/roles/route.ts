import { NextResponse } from "next/server";

import { requireStaffPermission } from "@/features/admin/http";
import { getAdminEngine } from "@/features/admin/server";
import type { StaffRole } from "@/features/admin/types";

export async function GET(request: Request) {
  const gate = await requireStaffPermission(request, "roles.manage");
  if (!gate.ok) return gate.response;

  const memberships = await getAdminEngine().roles.list();
  return NextResponse.json({
    success: true,
    data: memberships,
    message: "",
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: Request) {
  const gate = await requireStaffPermission(request, "roles.manage");
  if (!gate.ok) return gate.response;

  const body = (await request.json()) as {
    authUserId?: string;
    email?: string;
    role?: StaffRole;
  };

  if (!body.authUserId || !body.email || !body.role) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INVALID_BODY",
          message: "authUserId, email, and role are required",
        },
      },
      { status: 400 },
    );
  }

  if (!["ADMIN", "REVIEWER", "VIEWER"].includes(body.role)) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "INVALID_ROLE", message: "Invalid staff role" },
      },
      { status: 400 },
    );
  }

  const membership = await getAdminEngine().roles.assign({
    authUserId: body.authUserId,
    email: body.email,
    role: body.role,
  });

  await getAdminEngine().audit.record({
    actor: gate.actor,
    action: "USER_ROLE_CHANGED",
    objectType: "STAFF",
    objectId: membership.id,
    meta: { email: membership.email, role: membership.role },
  });

  return NextResponse.json({
    success: true,
    data: membership,
    message: "Role assigned",
    timestamp: new Date().toISOString(),
  });
}

export async function DELETE(request: Request) {
  const gate = await requireStaffPermission(request, "roles.manage");
  if (!gate.ok) return gate.response;

  const body = (await request.json()) as { id?: string };
  if (!body.id) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "INVALID_BODY", message: "id is required" },
      },
      { status: 400 },
    );
  }

  await getAdminEngine().roles.remove(body.id);
  await getAdminEngine().audit.record({
    actor: gate.actor,
    action: "USER_ROLE_CHANGED",
    objectType: "STAFF",
    objectId: body.id,
    meta: { removed: true },
  });

  return NextResponse.json({
    success: true,
    data: { id: body.id },
    message: "Role removed",
    timestamp: new Date().toISOString(),
  });
}
