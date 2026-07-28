export type StaffRole = "ADMIN" | "REVIEWER" | "VIEWER";

export type StaffPermission =
  | "books.import"
  | "books.delete"
  | "books.archive"
  | "books.reprocess"
  | "books.browse"
  | "ocr.view"
  | "ocr.rerun"
  | "ocr.accept"
  | "extraction.view"
  | "extraction.edit"
  | "extraction.rerun"
  | "knowledge.approve"
  | "knowledge.reject"
  | "knowledge.publish"
  | "knowledge.search"
  | "validation.run"
  | "audit.view"
  | "roles.manage"
  | "versions.view"
  | "versions.rollback";

export type StaffMembership = {
  id: string;
  authUserId: string;
  email: string;
  role: StaffRole;
  createdAt: string;
  updatedAt: string;
};

export type StaffActor = {
  authUserId: string;
  email: string;
  role: StaffRole;
  /** Synthetic local/dev actor when ADMIN_OPEN_LOCAL is enabled. */
  openLocal?: boolean;
};

export type AuditAction =
  | "BOOK_IMPORTED"
  | "BOOK_ARCHIVED"
  | "BOOK_VERSIONED"
  | "BOOK_DELETED"
  | "OCR_RUN"
  | "OCR_ACCEPTED"
  | "OCR_NEEDS_REVIEW"
  | "EXTRACTION_RUN"
  | "KNOWLEDGE_EDITED"
  | "KNOWLEDGE_APPROVED"
  | "KNOWLEDGE_REJECTED"
  | "KNOWLEDGE_PUBLISHED"
  | "VALIDATION_RUN"
  | "VERSION_CREATED"
  | "VERSION_ROLLBACK"
  | "USER_ROLE_CHANGED";

export type AuditLogRecord = {
  id: string;
  actorId: string | null;
  actorEmail: string | null;
  action: AuditAction;
  objectType: string | null;
  objectId: string | null;
  bookSlug: string | null;
  meta: Record<string, unknown> | null;
  createdAt: string;
};

export type KnowledgeVersionRecord = {
  id: string;
  bookSlug: string;
  objectType: string;
  objectId: string;
  version: number;
  payload: unknown;
  createdBy: string | null;
  note: string | null;
  createdAt: string;
};

export type PublicationStatus = "PUBLISHED" | "FAILED_VALIDATION" | "ROLLED_BACK";

export type PublicationRecord = {
  id: string;
  bookSlug: string;
  version: number;
  status: PublicationStatus;
  validationReport: ValidationReport | null;
  publishedBy: string | null;
  publishedAt: string;
};

export type ValidationIssueCode =
  | "MISSING_REFERENCE"
  | "DUPLICATE_VOCABULARY"
  | "DUPLICATE_RULE"
  | "MISSING_LESSON"
  | "INVALID_PAGE_LINK"
  | "BROKEN_REFERENCE";

export type ValidationIssue = {
  code: ValidationIssueCode;
  severity: "error" | "warning";
  message: string;
  bookSlug?: string;
  pageNumber?: number;
  objectId?: string;
};

export type ValidationReport = {
  bookSlug: string;
  ok: boolean;
  checkedAt: string;
  issues: ValidationIssue[];
};

export type OcrReviewStatus = "PENDING" | "ACCEPTED" | "NEEDS_REVIEW";

export type KnowledgeSearchHit = {
  kind:
    | "unit"
    | "lesson"
    | "rule"
    | "vocabulary"
    | "exercise"
    | "quran_word"
    | "book"
    | "page";
  bookSlug: string;
  pageNumber: number | null;
  title: string;
  snippet: string;
  objectId: string | null;
  verificationStatus: string | null;
};

export type AdminDashboardStats = {
  books: number;
  archivedBooks: number;
  pagesProcessed: number;
  ocrProgress: { done: number; total: number };
  extractionProgress: { done: number; total: number };
  verificationProgress: {
    approved: number;
    rejected: number;
    pending: number;
  };
  publishedKnowledge: number;
  pendingReviews: number;
  recentActivity: AuditLogRecord[];
  validationStatus: {
    lastOk: boolean | null;
    lastCheckedAt: string | null;
    openErrors: number;
  };
};
