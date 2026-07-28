import { readdir, readFile } from "fs/promises";
import path from "path";

import { getCurriculumSeed } from "@/features/learning/curriculum/seed";
import type { KnowledgeExportBundle } from "@/features/knowledge/types";
import {
  arabicIncludes,
  normalizeArabic,
} from "@/features/teacher/domain/arabic";
import type { KnowledgeReference } from "@/features/teacher/types";

type VocabHit = {
  id: string;
  arabic: string;
  urduMeaning: string;
  lessonId: string;
  source: "muallim_approved" | "curriculum_seed";
};

type RuleHit = {
  id: string;
  title: string;
  explanation: string;
  examples: string[];
  lessonId: string;
  source: "muallim_approved" | "curriculum_seed";
};

type LessonHit = {
  id: string;
  title: string;
  unit: number;
  lessonNumber: number;
  objectives: string[];
  source: "muallim_approved" | "curriculum_seed";
};

type ExerciseHit = {
  id: string;
  question: string;
  lessonId: string | null;
  source: "muallim_approved";
};

export type RetrievedKnowledge = {
  vocabulary: VocabHit[];
  rules: RuleHit[];
  lessons: LessonHit[];
  exercises: ExerciseHit[];
  references: KnowledgeReference[];
  hasApprovedMuallim: boolean;
};

async function loadApprovedExports(
  exportsDir: string,
): Promise<KnowledgeExportBundle[]> {
  try {
    const entries = await readdir(exportsDir);
    const bundles: KnowledgeExportBundle[] = [];
    for (const entry of entries) {
      if (!entry.endsWith(".json")) continue;
      try {
        const raw = await readFile(path.join(exportsDir, entry), "utf8");
        bundles.push(JSON.parse(raw) as KnowledgeExportBundle);
      } catch {
        // skip corrupt export
      }
    }
    return bundles;
  } catch {
    return [];
  }
}

function matchVocab(
  list: VocabHit[],
  input: {
    arabic?: string | null;
    lessonId?: string | null;
    question?: string;
  },
): VocabHit[] {
  const needle = input.arabic?.trim() || null;
  const question = input.question?.trim() || "";
  return list.filter((item) => {
    if (input.lessonId && item.lessonId === input.lessonId) return true;
    if (needle && arabicIncludes(item.arabic, needle)) return true;
    if (question && arabicIncludes(item.arabic, question)) return true;
    if (
      question &&
      normalizeArabic(question).length > 0 &&
      item.urduMeaning.includes(question.slice(0, 12))
    ) {
      return true;
    }
    return false;
  });
}

function matchRules(
  list: RuleHit[],
  input: {
    ruleId?: string | null;
    lessonId?: string | null;
    question?: string;
  },
): RuleHit[] {
  const question = input.question?.trim() || "";
  return list.filter((item) => {
    if (input.ruleId && item.id === input.ruleId) return true;
    if (input.lessonId && item.lessonId === input.lessonId) return true;
    if (question && item.title.includes(question.slice(0, 20))) return true;
    return Boolean(input.ruleId) || Boolean(input.lessonId);
  });
}

/**
 * Search verified (APPROVED) knowledge first, then curriculum seed for learning context.
 * Seed is never presented as Muallim-approved book content.
 */
export function createKnowledgeRetriever(options?: { exportsDir?: string }) {
  const exportsDir =
    options?.exportsDir ??
    path.join(process.cwd(), "knowledge", "books", "exports");

  return {
    async retrieve(input: {
      arabic?: string | null;
      lessonId?: string | null;
      ruleId?: string | null;
      question?: string | null;
    }): Promise<RetrievedKnowledge> {
      const seed = getCurriculumSeed();
      const exports = await loadApprovedExports(exportsDir);
      const hasApprovedMuallim = exports.length > 0;
      const question = input.question?.trim() || "";

      const approvedVocab: VocabHit[] = exports.flatMap((bundle) =>
        bundle.vocabulary.map((item) => ({
          id: item.id,
          arabic: item.arabic,
          urduMeaning: item.urdu ?? "",
          lessonId: String(item.lesson ?? item.bookSlug),
          source: "muallim_approved" as const,
        })),
      );

      const approvedRules: RuleHit[] = exports.flatMap((bundle) =>
        bundle.rules.map((item) => ({
          id: item.id,
          title: item.title ?? "قاعدہ",
          explanation: item.explanation ?? "",
          examples: item.examples ?? [],
          lessonId: String(item.lesson ?? item.bookSlug),
          source: "muallim_approved" as const,
        })),
      );

      const approvedLessons: LessonHit[] = exports.flatMap((bundle) =>
        bundle.lessons.map((item) => ({
          id: item.id,
          title: item.title ?? "سبق",
          unit: item.unit ?? 0,
          lessonNumber: item.lessonNumber ?? 0,
          objectives: item.objectives ?? [],
          source: "muallim_approved" as const,
        })),
      );

      const approvedExercises: ExerciseHit[] = exports.flatMap((bundle) =>
        bundle.exercises.map((item) => ({
          id: item.id,
          question: item.question,
          lessonId: item.lesson != null ? String(item.lesson) : null,
          source: "muallim_approved" as const,
        })),
      );

      const seedVocab: VocabHit[] = seed.vocabulary.map((item) => ({
        id: item.id,
        arabic: item.arabic,
        urduMeaning: item.urduMeaning,
        lessonId: item.lessonId,
        source: "curriculum_seed" as const,
      }));

      const seedRules: RuleHit[] = seed.rules.map((item) => ({
        id: item.id,
        title: item.title,
        explanation: item.explanation,
        examples: item.examples,
        lessonId: item.lessonId,
        source: "curriculum_seed" as const,
      }));

      const seedLessons: LessonHit[] = seed.lessons.map((item) => ({
        id: item.id,
        title: item.title,
        unit: item.unit,
        lessonNumber: item.lessonNumber,
        objectives: item.objectives,
        source: "curriculum_seed" as const,
      }));

      let vocabulary = matchVocab(approvedVocab, {
        arabic: input.arabic,
        lessonId: input.lessonId,
        question,
      });
      let rules = matchRules(approvedRules, {
        ruleId: input.ruleId,
        lessonId: input.lessonId,
        question,
      });
      let lessons = approvedLessons.filter(
        (item) => input.lessonId && item.id === input.lessonId,
      );
      let exercises = approvedExercises.filter(
        (item) =>
          (input.lessonId && item.lessonId === input.lessonId) ||
          (input.arabic && arabicIncludes(item.question, input.arabic)),
      );

      if (vocabulary.length === 0) {
        vocabulary = matchVocab(seedVocab, {
          arabic: input.arabic,
          lessonId: input.lessonId,
          question,
        }).slice(0, 5);
      }
      if (rules.length === 0 && (input.ruleId || input.lessonId)) {
        rules = matchRules(seedRules, {
          ruleId: input.ruleId,
          lessonId: input.lessonId,
          question,
        }).slice(0, 3);
      }
      if (lessons.length === 0) {
        const lessonId =
          input.lessonId ??
          vocabulary[0]?.lessonId ??
          rules[0]?.lessonId ??
          null;
        lessons = seedLessons
          .filter((item) => !lessonId || item.id === lessonId)
          .slice(0, 1);
      }

      if (
        !input.arabic &&
        !input.lessonId &&
        !input.ruleId &&
        vocabulary.length === 0
      ) {
        const current = seed.lessons[0];
        if (current) {
          vocabulary = seedVocab
            .filter((item) => item.lessonId === current.id)
            .slice(0, 4);
          lessons = seedLessons.filter((item) => item.id === current.id);
        }
      }

      const references: KnowledgeReference[] = [
        ...vocabulary.map((item) => ({
          kind: item.source,
          objectType: "vocabulary" as const,
          id: item.id,
          label: item.arabic,
          detail: item.urduMeaning,
        })),
        ...rules.map((item) => ({
          kind: item.source,
          objectType: "rule" as const,
          id: item.id,
          label: item.title,
          detail: item.explanation.slice(0, 120),
        })),
        ...lessons.map((item) => ({
          kind: item.source,
          objectType: "lesson" as const,
          id: item.id,
          label: item.title,
        })),
        ...exercises.slice(0, 3).map((item) => ({
          kind: "muallim_approved" as const,
          objectType: "exercise" as const,
          id: item.id,
          label: item.question.slice(0, 80),
        })),
      ];

      return {
        vocabulary: vocabulary.slice(0, 8),
        rules: rules.slice(0, 4),
        lessons: lessons.slice(0, 2),
        exercises: exercises.slice(0, 4),
        references,
        hasApprovedMuallim,
      };
    },
  };
}

export type KnowledgeRetriever = ReturnType<typeof createKnowledgeRetriever>;
