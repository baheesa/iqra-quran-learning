import path from "path";

import type { ExtractionProvider } from "@/features/knowledge/providers/types";
import type { FileKnowledgeRepository } from "@/features/knowledge/repository/file-repository";
import type {
  ExtractedExerciseItem,
  ExtractedLessonItem,
  ExtractedRuleItem,
  ExtractedVocabularyItem,
  KnowledgeVerificationStatus,
  PageExtraction,
} from "@/features/knowledge/types";

function averageConfidence(
  values: Array<number | null | undefined>,
): number | null {
  const nums = values.filter(
    (value): value is number => typeof value === "number",
  );
  if (nums.length === 0) {
    return null;
  }
  return nums.reduce((sum, value) => sum + value, 0) / nums.length;
}

export function createExtractionService(deps: {
  repo: FileKnowledgeRepository;
  extraction: ExtractionProvider;
}) {
  return {
    async extractPage(
      bookSlug: string,
      pageNumber: number,
    ): Promise<PageExtraction> {
      const manifest = await deps.repo.getManifest(bookSlug);
      if (!manifest) {
        throw new Error(`Unknown book: ${bookSlug}`);
      }

      const pages = await deps.repo.listPages(bookSlug);
      const page = pages.find((item) => item.pageNumber === pageNumber);
      const sourceImage = page?.imageRelativePath ?? null;
      const imageAbsolutePath = sourceImage
        ? path.join(deps.repo.dirs.root, sourceImage)
        : null;

      const ocr = await deps.repo.getOcrResult(bookSlug, pageNumber);
      const output = await deps.extraction.extract({
        bookSlug,
        pageNumber,
        ocrText: ocr?.rawText ?? "",
        unitNumber: manifest.unitNumber,
        imageAbsolutePath,
      });

      const createdAt = new Date().toISOString();
      const version = "1";
      const status: KnowledgeVerificationStatus = "PENDING";

      const lessons: ExtractedLessonItem[] = output.lessons.map(
        (lesson, index) => ({
          id: `${bookSlug}:p${pageNumber}:lesson:${index + 1}`,
          bookId: manifest.id,
          bookSlug,
          pageNumber,
          lesson: lesson.lessonNumber,
          sourceImage,
          confidence: lesson.confidence,
          verificationStatus: status,
          createdAt,
          version,
          title: lesson.title,
          lessonNumber: lesson.lessonNumber,
          unit: lesson.unit,
          objectives: lesson.objectives,
          page: pageNumber,
          verified: false,
        }),
      );

      const vocabulary: ExtractedVocabularyItem[] = output.vocabulary.map(
        (item, index) => ({
          id: `${bookSlug}:p${pageNumber}:vocab:${index + 1}`,
          bookId: manifest.id,
          bookSlug,
          pageNumber,
          lesson: item.lesson,
          sourceImage,
          confidence: item.confidence,
          verificationStatus: status,
          createdAt,
          version,
          arabic: item.arabic,
          urdu: item.urdu,
          unit: item.unit,
          page: pageNumber,
          verified: false,
          root: item.root ?? null,
          grammar: item.grammar ?? null,
          references: item.references ?? [],
          difficulty: item.difficulty ?? null,
        }),
      );

      const rules: ExtractedRuleItem[] = output.rules.map((item, index) => ({
        id: `${bookSlug}:p${pageNumber}:rule:${index + 1}`,
        bookId: manifest.id,
        bookSlug,
        pageNumber,
        lesson: item.lesson,
        sourceImage,
        confidence: item.confidence,
        verificationStatus: status,
        createdAt,
        version,
        title: item.title,
        explanation: item.explanation,
        examples: item.examples,
        unit: item.unit,
        page: pageNumber,
        verified: false,
      }));

      const exercises: ExtractedExerciseItem[] = output.exercises.map(
        (item, index) => ({
          id: `${bookSlug}:p${pageNumber}:exercise:${index + 1}`,
          bookId: manifest.id,
          bookSlug,
          pageNumber,
          lesson: item.lesson,
          sourceImage,
          confidence: item.confidence,
          verificationStatus: status,
          createdAt,
          version,
          question: item.question,
          answer: item.answer,
          exerciseType: item.exerciseType,
          unit: item.unit,
          page: pageNumber,
          difficulty: item.difficulty,
          verified: false,
        }),
      );

      const extraction: PageExtraction = {
        id: `${bookSlug}:p${pageNumber}:extraction`,
        bookId: manifest.id,
        bookSlug,
        pageNumber,
        provider: output.provider,
        version,
        createdAt,
        sourceImage,
        promptVersion: output.provider === "txt-structure"
          ? "txt-structure@1"
          : "prompt-10-knowledge-extraction@1",
        lessons,
        vocabulary,
        rules,
        exercises,
        examples: output.examples,
        reviewQuestions: output.reviewQuestions,
        headings: output.headings ?? [],
        tables: output.tables ?? [],
        quranReferences: output.quranReferences ?? [],
        confidence: averageConfidence([
          ...lessons.map((item) => item.confidence),
          ...vocabulary.map((item) => item.confidence),
          ...rules.map((item) => item.confidence),
          ...exercises.map((item) => item.confidence),
        ]),
        verificationStatus: status,
      };

      await deps.repo.saveExtraction(extraction);
      await deps.repo.appendLog({
        bookSlug,
        stage: "extraction",
        message: `Extracted page ${pageNumber} via ${output.provider}`,
        level: "info",
      });

      return extraction;
    },

    async extractBook(
      bookSlug: string,
      options?: { maxPages?: number },
    ): Promise<PageExtraction[]> {
      const pages = await deps.repo.listPages(bookSlug);
      const limit = options?.maxPages ?? pages.length;
      const results: PageExtraction[] = [];

      for (const page of pages.slice(0, limit)) {
        results.push(await this.extractPage(bookSlug, page.pageNumber));
      }

      const manifest = await deps.repo.getManifest(bookSlug);
      if (manifest) {
        await deps.repo.saveManifest({
          ...manifest,
          status: "EXTRACTED",
          updatedAt: new Date().toISOString(),
        });
      }

      return results;
    },

    list(bookSlug: string) {
      return deps.repo.listExtracted(bookSlug);
    },
  };
}

export type ExtractionService = ReturnType<typeof createExtractionService>;
