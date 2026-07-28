import type { StaffPermission, StaffRole } from "@/features/admin/types";

const ROLE_PERMISSIONS: Record<StaffRole, ReadonlySet<StaffPermission>> = {
  ADMIN: new Set([
    "books.import",
    "books.delete",
    "books.archive",
    "books.reprocess",
    "books.browse",
    "ocr.view",
    "ocr.rerun",
    "ocr.accept",
    "extraction.view",
    "extraction.edit",
    "extraction.rerun",
    "knowledge.approve",
    "knowledge.reject",
    "knowledge.publish",
    "knowledge.search",
    "validation.run",
    "audit.view",
    "roles.manage",
    "versions.view",
    "versions.rollback",
  ]),
  REVIEWER: new Set([
    "books.browse",
    "ocr.view",
    "ocr.rerun",
    "ocr.accept",
    "extraction.view",
    "extraction.edit",
    "extraction.rerun",
    "knowledge.approve",
    "knowledge.reject",
    "knowledge.search",
    "validation.run",
    "audit.view",
    "versions.view",
  ]),
  VIEWER: new Set([
    "books.browse",
    "ocr.view",
    "extraction.view",
    "knowledge.search",
    "audit.view",
    "versions.view",
  ]),
};

export function permissionsForRole(role: StaffRole): ReadonlySet<StaffPermission> {
  return ROLE_PERMISSIONS[role];
}

export function roleHasPermission(
  role: StaffRole,
  permission: StaffPermission,
): boolean {
  return ROLE_PERMISSIONS[role].has(permission);
}
