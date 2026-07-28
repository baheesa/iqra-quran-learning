/**
 * Bootstrap Unit 1 page 1 extraction from curriculum seed for admin review.
 * Does NOT invent Muallim content — copies labeled seed items and marks
 * verificationStatus = NEEDS_REVIEW so maintainers verify against the PDF image.
 */
import { randomUUID } from "crypto";

import { getCurriculumSeed } from "../features/learning/curriculum/seed";
import { createFileKnowledgeRepository } from "../features/knowledge/repository/file-repository";
import type { PageExtraction } from "../features/knowledge/types";

async function main() {
  const repo = createFileKnowledgeRepository();
  const seed = getCurriculumSeed();
  const bookSlug = "unit-1";
  const manifest = await repo.getManifest(bookSlug);
  if (!manifest) {
    throw new Error("Run Unit 1 import first (unit-1 manifest missing)");
  }

  const pageNumber = 1;
  const existing = await repo.getExtraction(bookSlug, pageNumber);
  const now = new Date().toISOString();
  const pageId =
    existing?.id ?? `${bookSlug}:p${pageNumber}:extraction`;

  const extraction: PageExtraction = {
    id: pageId,
    bookId: manifest.id,
    bookSlug,
    pageNumber,
    provider: "seed-bootstrap",
    version: "seed-1",
    createdAt: now,
    sourceImage: `pages/${bookSlug}/page-001.png`,
    promptVersion: null,
    lessons: seed.lessons
      .filter((lesson) => lesson.unit === 1)
      .map((lesson) => ({
        id: lesson.id,
        bookId: manifest.id,
        bookSlug,
        pageNumber,
        lesson: lesson.lessonNumber,
        sourceImage: `pages/${bookSlug}/page-001.png`,
        confidence: 0.5,
        verificationStatus: "NEEDS_REVIEW" as const,
        createdAt: now,
        version: "seed-1",
        title: lesson.title,
        lessonNumber: lesson.lessonNumber,
        unit: lesson.unit,
        objectives: lesson.objectives,
        page: pageNumber,
        verified: false,
      })),
    vocabulary: seed.vocabulary.map((vocab) => ({
      id: vocab.id,
      bookId: manifest.id,
      bookSlug,
      pageNumber,
      lesson:
        seed.lessons.find((lesson) => lesson.id === vocab.lessonId)
          ?.lessonNumber ?? null,
      sourceImage: `pages/${bookSlug}/page-001.png`,
      confidence: 0.5,
      verificationStatus: "NEEDS_REVIEW" as const,
      createdAt: now,
      version: "seed-1",
      arabic: vocab.arabic,
      urdu: vocab.urduMeaning,
      unit: 1,
      page: pageNumber,
      verified: false,
    })),
    rules: seed.rules.map((rule) => ({
      id: rule.id,
      bookId: manifest.id,
      bookSlug,
      pageNumber,
      lesson:
        seed.lessons.find((lesson) => lesson.id === rule.lessonId)
          ?.lessonNumber ?? null,
      sourceImage: `pages/${bookSlug}/page-001.png`,
      confidence: 0.5,
      verificationStatus: "NEEDS_REVIEW" as const,
      createdAt: now,
      version: "seed-1",
      title: rule.title,
      explanation: rule.explanation,
      examples: rule.examples,
      unit: 1,
      page: pageNumber,
      verified: false,
    })),
    exercises: [],
    examples: seed.rules.flatMap((rule) => rule.examples),
    reviewQuestions: [],
    headings: ["Unit 1 — seed bootstrap for review"],
    tables: [],
    confidence: 0.5,
    verificationStatus: "NEEDS_REVIEW",
  };

  await repo.saveExtraction(extraction);
  await repo.appendLog({
    bookSlug,
    stage: "extraction",
    message:
      "Bootstrapped page 1 from curriculum seed (NEEDS_REVIEW). Verify against PDF before approve/publish.",
    level: "info",
    meta: { id: randomUUID(), provider: "seed-bootstrap" },
  });

  console.log(
    JSON.stringify(
      {
        bookSlug,
        pageNumber,
        lessons: extraction.lessons.length,
        vocabulary: extraction.vocabulary.length,
        rules: extraction.rules.length,
        status: extraction.verificationStatus,
      },
      null,
      2,
    ),
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
