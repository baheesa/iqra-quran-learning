import type { AdminStore } from "@/features/admin/repository/types";
import type {
  AuditLogRecord,
  KnowledgeVersionRecord,
  PublicationRecord,
  StaffMembership,
  ValidationReport,
} from "@/features/admin/types";

export function createMemoryAdminStore(): AdminStore {
  const memberships = new Map<string, StaffMembership>();
  const audit: AuditLogRecord[] = [];
  const versions = new Map<string, KnowledgeVersionRecord>();
  const publications: PublicationRecord[] = [];
  const validation = new Map<string, ValidationReport>();

  function versionKey(
    bookSlug: string,
    objectType: string,
    objectId: string,
    version: number,
  ) {
    return `${bookSlug}:${objectType}:${objectId}:v${version}`;
  }

  return {
    async listMemberships() {
      return [...memberships.values()].sort((a, b) =>
        a.email.localeCompare(b.email),
      );
    },

    async getMembershipByAuthUserId(authUserId) {
      return (
        [...memberships.values()].find((item) => item.authUserId === authUserId) ??
        null
      );
    },

    async getMembershipByEmail(email) {
      const normalized = email.trim().toLowerCase();
      return (
        [...memberships.values()].find(
          (item) => item.email.toLowerCase() === normalized,
        ) ?? null
      );
    },

    async saveMembership(membership) {
      memberships.set(membership.id, membership);
    },

    async deleteMembership(id) {
      memberships.delete(id);
    },

    async appendAudit(entry) {
      audit.unshift(entry);
    },

    async listAudit(limit = 100) {
      return audit.slice(0, limit);
    },

    async saveVersion(record) {
      versions.set(
        versionKey(
          record.bookSlug,
          record.objectType,
          record.objectId,
          record.version,
        ),
        record,
      );
    },

    async listVersions(bookSlug, objectType, objectId) {
      return [...versions.values()]
        .filter(
          (item) =>
            item.bookSlug === bookSlug &&
            item.objectType === objectType &&
            item.objectId === objectId,
        )
        .sort((a, b) => b.version - a.version);
    },

    async getVersion(bookSlug, objectType, objectId, version) {
      return (
        versions.get(versionKey(bookSlug, objectType, objectId, version)) ??
        null
      );
    },

    async savePublication(record) {
      const idx = publications.findIndex((item) => item.id === record.id);
      if (idx >= 0) {
        publications[idx] = record;
      } else {
        publications.unshift(record);
      }
    },

    async listPublications(bookSlug) {
      const items = bookSlug
        ? publications.filter((item) => item.bookSlug === bookSlug)
        : publications;
      return [...items].sort((a, b) =>
        b.publishedAt.localeCompare(a.publishedAt),
      );
    },

    async saveValidationReport(report) {
      validation.set(report.bookSlug, report);
    },

    async getValidationReport(bookSlug) {
      return validation.get(bookSlug) ?? null;
    },
  };
}
