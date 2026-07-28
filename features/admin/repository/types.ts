import type {
  AuditLogRecord,
  KnowledgeVersionRecord,
  PublicationRecord,
  StaffMembership,
  ValidationReport,
} from "@/features/admin/types";

export type AdminStore = {
  listMemberships(): Promise<StaffMembership[]>;
  getMembershipByAuthUserId(
    authUserId: string,
  ): Promise<StaffMembership | null>;
  getMembershipByEmail(email: string): Promise<StaffMembership | null>;
  saveMembership(membership: StaffMembership): Promise<void>;
  deleteMembership(id: string): Promise<void>;

  appendAudit(entry: AuditLogRecord): Promise<void>;
  listAudit(limit?: number): Promise<AuditLogRecord[]>;

  saveVersion(record: KnowledgeVersionRecord): Promise<void>;
  listVersions(
    bookSlug: string,
    objectType: string,
    objectId: string,
  ): Promise<KnowledgeVersionRecord[]>;
  getVersion(
    bookSlug: string,
    objectType: string,
    objectId: string,
    version: number,
  ): Promise<KnowledgeVersionRecord | null>;

  savePublication(record: PublicationRecord): Promise<void>;
  listPublications(bookSlug?: string): Promise<PublicationRecord[]>;

  saveValidationReport(report: ValidationReport): Promise<void>;
  getValidationReport(bookSlug: string): Promise<ValidationReport | null>;
};
