import { randomUUID } from "crypto";

import { roleHasPermission } from "@/features/admin/permissions";
import type { AdminStore } from "@/features/admin/repository/types";
import type {
  StaffActor,
  StaffMembership,
  StaffPermission,
  StaffRole,
} from "@/features/admin/types";

export function createRoleService(store: AdminStore) {
  return {
    list() {
      return store.listMemberships();
    },

    getByAuthUserId(authUserId: string) {
      return store.getMembershipByAuthUserId(authUserId);
    },

    getByEmail(email: string) {
      return store.getMembershipByEmail(email);
    },

    async assign(input: {
      authUserId: string;
      email: string;
      role: StaffRole;
    }): Promise<StaffMembership> {
      const existing =
        (await store.getMembershipByAuthUserId(input.authUserId)) ??
        (await store.getMembershipByEmail(input.email));
      const now = new Date().toISOString();
      const membership: StaffMembership = {
        id: existing?.id ?? randomUUID(),
        authUserId: input.authUserId,
        email: input.email.trim().toLowerCase(),
        role: input.role,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };
      await store.saveMembership(membership);
      return membership;
    },

    async remove(id: string): Promise<void> {
      await store.deleteMembership(id);
    },

    async resolveActor(input: {
      authUserId: string;
      email: string;
    }): Promise<StaffActor | null> {
      const membership =
        (await store.getMembershipByAuthUserId(input.authUserId)) ??
        (await store.getMembershipByEmail(input.email));
      if (!membership) return null;
      return {
        authUserId: membership.authUserId,
        email: membership.email,
        role: membership.role,
      };
    },

    can(actor: StaffActor, permission: StaffPermission): boolean {
      return roleHasPermission(actor.role, permission);
    },

    assert(actor: StaffActor, permission: StaffPermission): void {
      if (!roleHasPermission(actor.role, permission)) {
        throw new Error(
          `Role ${actor.role} is not allowed to perform ${permission}`,
        );
      }
    },
  };
}

export type RoleService = ReturnType<typeof createRoleService>;
