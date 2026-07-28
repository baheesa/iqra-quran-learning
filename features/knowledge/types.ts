export type PipelineStatus =
  | "DISCOVERED"
  | "REGISTERED"
  | "PAGES_EXTRACTED"
  | "OCR_COMPLETE"
  | "EXTRACTED"
  | "VERIFIED"
  | "APPROVED"
  | "ARCHIVED"
  | "FAILED";

/** Verification workflow statuses. */
export type KnowledgeVerificationStatus =
  "PENDING" | "NEEDS_REVIEW" | "VERIFIED" | "APPROVED" | "REJECTED";

export type TraceableFields = {
  id: string;
  bookId: string;
  bookSlug: string;
  pageNumber: number;
  lesson: number | null;
  sourceImage: string | null;
  confidence: number | null;
  verificationStatus: KnowledgeVerificationStatus;
  createdAt: string;
  version: string;
};

export type DiscoveredBook = {
  fileName: string;
  absolutePath: string;
  title: string;
  unitNumber: number | null;
  checksum: string;
  sizeBytes: number;
  /** Primary knowledge source kind. */
  sourceKind: "txt" | "pdf";
};

export type BookManifest = {
  id: string;
  slug: string;
  title: string;
  unitNumber: number | null;
  originalFileName: string;
  originalRelativePath: string;
  checksum: string;
  pageCount: number | null;
  status: PipelineStatus;
  importedAt: string;
  updatedAt: string;
  version: string;
  /** txt = manually transcribed primary source; pdf = legacy/optional. */
  sourceKind?: "txt" | "pdf";
  /** Total characters in the TXT original (UTF-16 code units via spread). */
  characterCount?: number | null;
  /** Number of parsed sections after TXT ingest. */
  sectionCount?: number | null;
  /** Checksum of the TXT that was last successfully ingested. */
  sourceChecksum?: string | null;
};

export type BookPageRecord = {
  bookId: string;
  bookSlug: string;
  pageNumber: number;
  imageRelativePath: string | null;
  width: number | null;
  height: number | null;
  status: "PENDING" | "RENDERED" | "FAILED";
  updatedAt: string;
};

export type BoundingBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type OcrReviewStatus = "PENDING" | "ACCEPTED" | "NEEDS_REVIEW";

export type OcrResult = {
  bookSlug: string;
  pageNumber: number;
  provider: string;
  rawText: string;
  confidence: number | null;
  language: string | null;
  boundingBoxes: BoundingBox[];
  sourceImagePath: string | null;
  createdAt: string;
  version: string;
  /** Maintainer OCR acceptance — independent of extraction approval. */
  reviewStatus?: OcrReviewStatus;
};

export type ExtractedVocabularyItem = TraceableFields & {
  arabic: string;
  urdu: string | null;
  unit: number | null;
  page: number;
  verified: boolean;
  root?: string | null;
  grammar?: string | null;
  references?: string[];
  difficulty?: number | null;
};

export type ExtractedRuleItem = TraceableFields & {
  title: string;
  explanation: string | null;
  examples: string[];
  unit: number | null;
  page: number;
  verified: boolean;
};

export type ExtractedExerciseItem = TraceableFields & {
  question: string;
  answer: string | null;
  exerciseType: string | null;
  unit: number | null;
  page: number;
  difficulty: number | null;
  verified: boolean;
};

export type ExtractedLessonItem = TraceableFields & {
  title: string | null;
  lessonNumber: number | null;
  unit: number | null;
  objectives: string[];
  page: number;
  verified: boolean;
};

export type PageExtraction = {
  id: string;
  bookId: string;
  bookSlug: string;
  pageNumber: number;
  provider: string;
  version: string;
  createdAt: string;
  sourceImage: string | null;
  promptVersion: string | null;
  lessons: ExtractedLessonItem[];
  vocabulary: ExtractedVocabularyItem[];
  rules: ExtractedRuleItem[];
  exercises: ExtractedExerciseItem[];
  examples: string[];
  reviewQuestions: string[];
  headings: string[];
  tables: string[];
  quranReferences?: string[];
  confidence: number | null;
  verificationStatus: KnowledgeVerificationStatus;
};

export type VerificationRecord = {
  id: string;
  bookSlug: string;
  pageNumber: number;
  objectType: "PAGE" | "LESSON" | "VOCABULARY" | "RULE" | "EXERCISE";
  objectId: string;
  status: KnowledgeVerificationStatus;
  note: string | null;
  updatedAt: string;
  /** Set for development auto-approval (`development-auto`); null for manual. */
  approvedBy?: string | null;
  approvedAt?: string | null;
  approvalReason?: string | null;
};

export type ExtractionLogEntry = {
  id: string;
  bookSlug: string;
  stage: string;
  message: string;
  level: "info" | "warn" | "error";
  createdAt: string;
  meta?: Record<string, unknown>;
};

export type KnowledgeExportBundle = {
  bookSlug: string;
  exportedAt: string;
  lessons: ExtractedLessonItem[];
  vocabulary: ExtractedVocabularyItem[];
  rules: ExtractedRuleItem[];
  exercises: ExtractedExerciseItem[];
  quranReferences?: string[];
};
