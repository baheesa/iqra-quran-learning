import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getAdminEngine } from "@/features/admin/server";
import type { StaffActor, StaffPermission } from "@/features/admin/types";
import { getBearerToken } from "@/features/auth/http";
import { getAuthSyncEngine } from "@/features/auth/server";
import { apiError } from "@/lib/api/errors";
import { isAdminOpenLocalEnabled } from "@/lib/security/admin-open-local";

export async function resolveStaffActor(
  request: Request | NextRequest,
): Promise<StaffActor | null> {
  const admin = getAdminEngine();
  const token = getBearerToken(request);

  if (token) {
    const session = await getAuthSyncEngine().sessions.resolve(token);
    if (session.session?.user) {
      const actor = await admin.roles.resolveActor({
        authUserId: session.session.user.id,
        email: session.session.user.email,
      });
      if (actor) return actor;
    }
  }

  // Test header: x-admin-role + x-admin-email (test / memory only)
  const testRole = request.headers.get("x-admin-role");
  const testEmail = request.headers.get("x-admin-email") ?? "admin@test.local";
  if (
    testRole &&
    (process.env.NODE_ENV === "test" || process.env.ADMIN_PROVIDER === "memory")
  ) {
    if (
      testRole === "ADMIN" ||
      testRole === "REVIEWER" ||
      testRole === "VIEWER"
    ) {
      const membership = await admin.roles.assign({
        authUserId: `test-${testEmail}`,
        email: testEmail,
        role: testRole,
      });
      return {
        authUserId: membership.authUserId,
        email: membership.email,
        role: membership.role,
      };
    }
  }

  // Opt-in local admin ONLY when ADMIN_OPEN_LOCAL=1|true (never in production).
  if (isAdminOpenLocalEnabled()) {
    return {
      authUserId: "local-admin",
      email: process.env.ADMIN_BOOTSTRAP_EMAIL ?? "admin@local",
      role: "ADMIN",
      openLocal: true,
    };
  }

  return null;
}

export async function requireStaffPermission(
  request: Request | NextRequest,
  permission: StaffPermission,
): Promise<
  | { ok: true; actor: StaffActor }
  | { ok: false; response: NextResponse }
> {
  const actor = await resolveStaffActor(request);
  if (!actor) {
    return {
      ok: false,
      response: apiError(
        "UNAUTHORIZED",
        "Staff authentication required",
        401,
        { log: true },
      ),
    };
  }

  const admin = getAdminEngine();
  if (!admin.roles.can(actor, permission)) {
    return {
      ok: false,
      response: apiError(
        "FORBIDDEN",
        `Role ${actor.role} cannot ${permission}`,
        403,
      ),
    };
  }

  return { ok: true, actor };
}
