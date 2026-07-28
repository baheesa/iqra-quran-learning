import type { BoundingBox } from "@/features/knowledge/types";

export type PdfMetadata = {
  pageCount: number;
  title: string | null;
};

export type RenderedPage = {
  pageNumber: number;
  /** PNG bytes when rendered; null when provider only registers pages. */
  imageBytes: Uint8Array | null;
  width: number | null;
  height: number | null;
};

/**
 * Swappable PDF backend.
 * Implementations may use pdf-lib, pdf.js, Poppler, etc.
 */
export type PdfProvider = {
  readonly name: string;
  getMetadata(pdfAbsolutePath: string): Promise<PdfMetadata>;
  /**
   * Render pages as images. May return imageBytes=null when rendering
   * is deferred (metadata-only providers).
   */
  renderPages(
    pdfAbsolutePath: string,
    options?: { maxPages?: number },
  ): Promise<RenderedPage[]>;
};

export type OcrInput = {
  bookSlug: string;
  pageNumber: number;
  imageAbsolutePath: string | null;
  /** Optional raw PDF path for vision-first providers. */
  pdfAbsolutePath?: string;
};

export type OcrOutput = {
  rawText: string;
  confidence: number | null;
  language: string | null;
  boundingBoxes: BoundingBox[];
  provider: string;
};

/**
 * Swappable OCR / vision backend.
 * Never invent text — return empty/low confidence when uncertain.
 */
export type OcrProvider = {
  readonly name: string;
  recognize(input: OcrInput): Promise<OcrOutput>;
};

export type ExtractionInput = {
  bookSlug: string;
  pageNumber: number;
  ocrText: string;
  unitNumber: number | null;
  imageAbsolutePath?: string | null;
};

export type ExtractionOutput = {
  provider: string;
  lessons: Array<{
    title: string | null;
    lessonNumber: number | null;
    unit: number | null;
    objectives: string[];
    confidence: number | null;
  }>;
  vocabulary: Array<{
    arabic: string;
    urdu: string | null;
    lesson: number | null;
    unit: number | null;
    confidence: number | null;
    root?: string | null;
    grammar?: string | null;
    references?: string[];
    difficulty?: number | null;
  }>;
  rules: Array<{
    title: string;
    explanation: string | null;
    examples: string[];
    lesson: number | null;
    unit: number | null;
    confidence: number | null;
  }>;
  exercises: Array<{
    question: string;
    answer: string | null;
    exerciseType: string | null;
    lesson: number | null;
    unit: number | null;
    difficulty: number | null;
    confidence: number | null;
  }>;
  examples: string[];
  reviewQuestions: string[];
  headings?: string[];
  tables?: string[];
  /** Quran phrases/verses detected in the section (traceable to TXT). */
  quranReferences?: string[];
};

/**
 * Swappable AI extraction backend.
 * Extract only — never invent curriculum content.
 */
export type ExtractionProvider = {
  readonly name: string;
  extract(input: ExtractionInput): Promise<ExtractionOutput>;
};
