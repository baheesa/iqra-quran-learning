import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

import type { AdminStore } from "@/features/admin/repository/types";
import type {
  AuditLogRecord,
  KnowledgeVersionRecord,
  PublicationRecord,
  StaffMembership,
  ValidationReport,
} from "@/features/admin/types";

async function ensureDir(dir: string) {
  await mkdir(dir, { recursive: true });
}

async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(filePath: string, data: unknown) {
  await ensureDir(path.dirname(filePath));
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

export function createFileAdminStore(rootDir: string): AdminStore {
  const rolesPath = path.join(rootDir, "roles.json");
  const auditPath = path.join(rootDir, "audit.json");
  const publicationsPath = path.join(rootDir, "publications.json");
  const validationDir = path.join(rootDir, "validation");
  const versionsDir = path.join(rootDir, "versions");

  return {
    async listMemberships() {
      return readJson<StaffMembership[]>(rolesPath, []);
    },

    async getMembershipByAuthUserId(authUserId) {
      const all = await this.listMemberships();
      return all.find((item) => item.authUserId === authUserId) ?? null;
    },

    async getMembershipByEmail(email) {
      const normalized = email.trim().toLowerCase();
      const all = await this.listMemberships();
      return (
        all.find((item) => item.email.toLowerCase() === normalized) ?? null
      );
    },

    async saveMembership(membership) {
      const all = await this.listMemberships();
      const next = [
        membership,
        ...all.filter((item) => item.id !== membership.id),
      ];
      await writeJson(rolesPath, next);
    },

    async deleteMembership(id) {
      const all = await this.listMemberships();
      await writeJson(
        rolesPath,
        all.filter((item) => item.id !== id),
      );
    },

    async appendAudit(entry) {
      const all = await readJson<AuditLogRecord[]>(auditPath, []);
      all.unshift(entry);
      await writeJson(auditPath, all.slice(0, 5000));
    },

    async listAudit(limit = 100) {
      const all = await readJson<AuditLogRecord[]>(auditPath, []);
      return all.slice(0, limit);
    },

    async saveVersion(record) {
      const dir = path.join(
        versionsDir,
        record.bookSlug,
        record.objectType,
        record.objectId,
      );
      await writeJson(path.join(dir, `v${record.version}.json`), record);
      const index = await readJson<KnowledgeVersionRecord[]>(
        path.join(dir, "index.json"),
        [],
      );
      const next = [
        record,
        ...index.filter((item) => item.version !== record.version),
      ].sort((a, b) => b.version - a.version);
      await writeJson(path.join(dir, "index.json"), next);
    },

    async listVersions(bookSlug, objectType, objectId) {
      return readJson<KnowledgeVersionRecord[]>(
        path.join(versionsDir, bookSlug, objectType, objectId, "index.json"),
        [],
      );
    },

    async getVersion(bookSlug, objectType, objectId, version) {
      return readJson<KnowledgeVersionRecord | null>(
        path.join(
          versionsDir,
          bookSlug,
          objectType,
          objectId,
          `v${version}.json`,
        ),
        null,
      );
    },

    async savePublication(record) {
      const all = await readJson<PublicationRecord[]>(publicationsPath, []);
      const next = [record, ...all.filter((item) => item.id !== record.id)];
      await writeJson(publicationsPath, next);
    },

    async listPublications(bookSlug) {
      const all = await readJson<PublicationRecord[]>(publicationsPath, []);
      return (bookSlug
        ? all.filter((item) => item.bookSlug === bookSlug)
        : all
      ).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
    },

    async saveValidationReport(report) {
      await writeJson(path.join(validationDir, `${report.bookSlug}.json`), report);
    },

    async getValidationReport(bookSlug) {
      return readJson<ValidationReport | null>(
        path.join(validationDir, `${bookSlug}.json`),
        null,
      );
    },
  };
}
