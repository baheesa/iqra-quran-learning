import path from "path";

export const KNOWLEDGE_BOOKS_ROOT = path.join(
  process.cwd(),
  "knowledge",
  "books",
);

export const knowledgePaths = {
  root: KNOWLEDGE_BOOKS_ROOT,
  original: path.join(KNOWLEDGE_BOOKS_ROOT, "original"),
  processed: path.join(KNOWLEDGE_BOOKS_ROOT, "processed"),
  pages: path.join(KNOWLEDGE_BOOKS_ROOT, "pages"),
  ocr: path.join(KNOWLEDGE_BOOKS_ROOT, "ocr"),
  extracted: path.join(KNOWLEDGE_BOOKS_ROOT, "extracted"),
  verified: path.join(KNOWLEDGE_BOOKS_ROOT, "verified"),
  exports: path.join(KNOWLEDGE_BOOKS_ROOT, "exports"),
  logs: path.join(KNOWLEDGE_BOOKS_ROOT, "logs"),
} as const;

export function bookProcessedDir(bookSlug: string): string {
  return path.join(knowledgePaths.processed, bookSlug);
}

export function bookPagesDir(bookSlug: string): string {
  return path.join(knowledgePaths.pages, bookSlug);
}

export function bookOcrDir(bookSlug: string): string {
  return path.join(knowledgePaths.ocr, bookSlug);
}

export function bookExtractedDir(bookSlug: string): string {
  return path.join(knowledgePaths.extracted, bookSlug);
}

export function bookVerifiedDir(bookSlug: string): string {
  return path.join(knowledgePaths.verified, bookSlug);
}

export function bookExportsDir(bookSlug: string): string {
  return path.join(knowledgePaths.exports, bookSlug);
}

export function pageImageFileName(pageNumber: number): string {
  return `page-${String(pageNumber).padStart(3, "0")}.png`;
}

export function pageJsonFileName(pageNumber: number): string {
  return `page-${String(pageNumber).padStart(3, "0")}.json`;
}
