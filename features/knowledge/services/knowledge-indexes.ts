import { mkdir, writeFile } from "fs/promises";
import path from "path";

import { buildVocabularyIndexFromBundles } from "@/features/knowledge/domain/vocabulary-lookup";
import { knowledgePaths } from "@/features/knowledge/paths";
import {
  clearQuranTokenIndexCache,
  rebuildQuranTokenIndex,
} from "@/features/knowledge/services/quran-token-index";
import {
  clearVocabularyIndexCache,
  loadExportBundles,
  vocabularyIndexPath,
} from "@/features/knowledge/services/vocabulary-index";
import type { KnowledgeExportBundle } from "@/features/knowledge/types";
import { normalizeArabic } from "@/features/teacher/domain/arabic";

export type RulesIndexEntry = {
  id: string;
  title: string;
  explanation: string | null;
  examples: string[];
  lesson: number | null;
  unit: number | null;
  page: number | null;
  bookSlug: string;
  relatedVocabulary: string[];
  relatedLessons: string[];
};

export type LessonsIndexEntry = {
  id: string;
  title: string | null;
  lessonNumber: number | null;
  unit: number | null;
  page: number | null;
  bookSlug: string;
  objectives: string[];
  vocabulary: string[];
  rules: string[];
  exercises: string[];
  quranReferences: string[];
};

export type ReferencesIndexEntry = {
  text: string;
  normalized: string;
  bookSlug: string;
  page: number | null;
  unit: number | null;
  relatedVocabulary: string[];
  relatedLessons: string[];
};

export type KnowledgeIndexesSummary = {
  vocabularyEntries: number;
  rules: number;
  lessons: number;
  references: number;
  exercises: number;
  quranTokens: number;
  builtAt: string;
};

function buildRulesIndex(bundles: KnowledgeExportBundle[]): {
  entryCount: number;
  entries: Record<string, RulesIndexEntry>;
} {
  const entries: Record<string, RulesIndexEntry> = {};
  for (const bundle of bundles) {
    for (const rule of bundle.rules) {
      const relatedVocabulary = bundle.vocabulary
        .filter(
          (item) =>
            item.unit === rule.unit ||
            item.lesson === rule.lesson ||
            item.page === rule.page,
        )
        .map((item) => item.arabic)
        .slice(0, 40);
      const relatedLessons = bundle.lessons
        .filter(
          (item) =>
            item.unit === rule.unit ||
            item.lessonNumber === rule.lesson ||
            item.page === rule.page,
        )
        .map((item) => item.title ?? item.id)
        .slice(0, 20);

      entries[rule.id] = {
        id: rule.id,
        title: rule.title,
        explanation: rule.explanation,
        examples: rule.examples,
        lesson: rule.lesson,
        unit: rule.unit,
        page: rule.page ?? rule.pageNumber ?? null,
        bookSlug: rule.bookSlug || bundle.bookSlug,
        relatedVocabulary,
        relatedLessons,
      };
    }
  }
  return { entryCount: Object.keys(entries).length, entries };
}

function buildLessonsIndex(bundles: KnowledgeExportBundle[]): {
  entryCount: number;
  entries: Record<string, LessonsIndexEntry>;
} {
  const entries: Record<string, LessonsIndexEntry> = {};
  for (const bundle of bundles) {
    for (const lesson of bundle.lessons) {
      const vocabulary = bundle.vocabulary
        .filter(
          (item) =>
            item.lesson === lesson.lessonNumber ||
            item.page === lesson.page ||
            item.unit === lesson.unit,
        )
        .map((item) => item.arabic);
      const rules = bundle.rules
        .filter(
          (item) =>
            item.lesson === lesson.lessonNumber ||
            item.page === lesson.page ||
            item.unit === lesson.unit,
        )
        .map((item) => item.title);
      const exercises = bundle.exercises
        .filter(
          (item) =>
            item.lesson === lesson.lessonNumber ||
            item.page === lesson.page ||
            item.unit === lesson.unit,
        )
        .map((item) => item.question);
      const quranReferences = [
        ...(bundle.quranReferences ?? []),
        ...bundle.vocabulary.flatMap((item) => item.references ?? []),
      ].filter((item, index, all) => all.indexOf(item) === index);

      entries[lesson.id] = {
        id: lesson.id,
        title: lesson.title,
        lessonNumber: lesson.lessonNumber,
        unit: lesson.unit,
        page: lesson.page ?? lesson.pageNumber ?? null,
        bookSlug: lesson.bookSlug || bundle.bookSlug,
        objectives: lesson.objectives,
        vocabulary,
        rules,
        exercises,
        quranReferences: quranReferences.slice(0, 80),
      };
    }
  }
  return { entryCount: Object.keys(entries).length, entries };
}

function buildReferencesIndex(bundles: KnowledgeExportBundle[]): {
  entryCount: number;
  entries: Record<string, ReferencesIndexEntry>;
} {
  const entries: Record<string, ReferencesIndexEntry> = {};
  for (const bundle of bundles) {
    const fromBundle = bundle.quranReferences ?? [];
    const fromVocab = bundle.vocabulary.flatMap((item) =>
      (item.references ?? []).map((text) => ({
        text,
        vocab: item.arabic,
        page: item.page ?? item.pageNumber ?? null,
        unit: item.unit,
      })),
    );

    for (const text of fromBundle) {
      const key = normalizeArabic(text);
      if (!key) continue;
      const existing = entries[key];
      entries[key] = {
        text,
        normalized: key,
        bookSlug: bundle.bookSlug,
        page: existing?.page ?? null,
        unit: existing?.unit ?? null,
        relatedVocabulary: existing?.relatedVocabulary ?? [],
        relatedLessons: existing?.relatedLessons ?? [],
      };
    }

    for (const item of fromVocab) {
      const key = normalizeArabic(item.text);
      if (!key) continue;
      const existing = entries[key];
      const relatedVocabulary = [
        ...(existing?.relatedVocabulary ?? []),
        item.vocab,
      ].filter((value, index, all) => all.indexOf(value) === index);
      entries[key] = {
        text: item.text,
        normalized: key,
        bookSlug: bundle.bookSlug,
        page: item.page ?? existing?.page ?? null,
        unit: item.unit ?? existing?.unit ?? null,
        relatedVocabulary,
        relatedLessons: existing?.relatedLessons ?? [],
      };
    }
  }
  return { entryCount: Object.keys(entries).length, entries };
}

/**
 * Rebuild all searchable indexes from approved export bundles.
 */
export async function rebuildAllKnowledgeIndexes(
  exportsDir = knowledgePaths.exports,
): Promise<KnowledgeIndexesSummary> {
  const bundles = await loadExportBundles(exportsDir);
  const builtAt = new Date().toISOString();

  const vocabulary = buildVocabularyIndexFromBundles(bundles);
  const rules = buildRulesIndex(bundles);
  const lessons = buildLessonsIndex(bundles);
  const references = buildReferencesIndex(bundles);
  const exercises = bundles.reduce(
    (sum, bundle) => sum + bundle.exercises.length,
    0,
  );

  await mkdir(exportsDir, { recursive: true });
  await writeFile(
    vocabularyIndexPath(exportsDir),
    JSON.stringify({ ...vocabulary, builtAt }, null, 2),
    "utf8",
  );
  await writeFile(
    path.join(exportsDir, "rules-index.json"),
    JSON.stringify({ version: 1, builtAt, ...rules }, null, 2),
    "utf8",
  );
  await writeFile(
    path.join(exportsDir, "lessons-index.json"),
    JSON.stringify({ version: 1, builtAt, ...lessons }, null, 2),
    "utf8",
  );
  await writeFile(
    path.join(exportsDir, "references-index.json"),
    JSON.stringify({ version: 1, builtAt, ...references }, null, 2),
    "utf8",
  );

  clearVocabularyIndexCache();

  const quranTokens = await rebuildQuranTokenIndex();
  clearQuranTokenIndexCache();

  return {
    vocabularyEntries: vocabulary.entryCount,
    rules: rules.entryCount,
    lessons: lessons.entryCount,
    references: references.entryCount,
    exercises,
    quranTokens: quranTokens.tokenCount,
    builtAt,
  };
}
