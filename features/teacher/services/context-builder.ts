import { getCurriculumSeed } from "@/features/learning/curriculum/seed";
import type { LearningEngine } from "@/features/learning/create-engine";
import type { AdaptationHints } from "@/features/personalization/types";
import type { RetrievedKnowledge } from "@/features/teacher/services/knowledge-retriever";
import type {
  TeacherAskInput,
  TeacherContext,
  TeacherReadingContext,
} from "@/features/teacher/types";

const MAX_KNOWN = 8;
const MAX_UNKNOWN = 6;
const MAX_WEAK = 5;
const MAX_REVIEWS = 5;
const MAX_REFLECTIONS = 3;

/**
 * Builds minimum teaching context from Learning Engine + reading position.
 * Learning Engine decides WHAT; this only packages context for HOW.
 */
export function createContextBuilder(
  learning: LearningEngine,
  options?: {
    getAdaptation?: () => AdaptationHints | null;
  },
) {
  return {
    build(input: {
      ask: TeacherAskInput;
      knowledge: RetrievedKnowledge;
    }): TeacherContext {
      const state = learning.repo.getState();
      const seed = getCurriculumSeed();
      const readingInput = input.ask.reading ?? {};

      const reading: TeacherReadingContext = {
        page: readingInput.page ?? state.profile.currentPage,
        juz: readingInput.juz ?? state.profile.currentJuz,
        surahId: readingInput.surahId ?? null,
        ayahNumber: readingInput.ayahNumber ?? null,
        selectedWord: readingInput.selectedWord ?? null,
        selectedPhrase: readingInput.selectedPhrase ?? null,
      };

      const progress = state.vocabularyProgress;
      const known = progress
        .filter(
          (item) => item.stage === "UNDERSTOOD" || item.stage === "MASTERED",
        )
        .slice(0, MAX_KNOWN)
        .map((item) => {
          const vocab = seed.vocabulary.find((v) => v.id === item.vocabularyId);
          return {
            id: item.vocabularyId,
            arabic: vocab?.arabic ?? item.vocabularyId,
            confidence: item.confidence,
            stage: item.stage,
          };
        });

      const inProgressIds = new Set(progress.map((item) => item.vocabularyId));
      const unknown = seed.vocabulary
        .filter((item) => !inProgressIds.has(item.id))
        .slice(0, MAX_UNKNOWN)
        .map((item) => ({ id: item.id, arabic: item.arabic }));

      const weak = [...progress]
        .filter((item) => item.stage !== "UNKNOWN")
        .sort((a, b) => a.confidence - b.confidence)
        .slice(0, MAX_WEAK)
        .map((item) => {
          const vocab = seed.vocabulary.find((v) => v.id === item.vocabularyId);
          return {
            id: item.vocabularyId,
            arabic: vocab?.arabic ?? item.vocabularyId,
            confidence: item.confidence,
          };
        });

      const recentReviews = learning.review
        .buildQueue({ limit: MAX_REVIEWS })
        .map((item) => ({
          vocabularyId: item.vocabulary.id,
          arabic: item.vocabulary.arabic,
          status: item.progress?.stage ?? "UNKNOWN",
        }));

      const recentReflections = learning.reflections
        .list()
        .slice(0, MAX_REFLECTIONS)
        .map((item) => ({
          understoodToday: item.understoodToday,
          createdAt: item.createdAt,
        }));

      const lessonId =
        input.ask.lessonId ??
        input.knowledge.lessons[0]?.id ??
        state.profile.currentLessonId;

      const lessonMeta =
        input.knowledge.lessons[0] ??
        seed.lessons.find((item) => item.id === lessonId) ??
        null;

      const relatedLesson = lessonMeta
        ? {
            id: lessonMeta.id,
            title: lessonMeta.title,
            unit: lessonMeta.unit,
            lessonNumber: lessonMeta.lessonNumber,
          }
        : null;

      const ruleMeta =
        input.knowledge.rules.find((item) => item.id === input.ask.ruleId) ??
        input.knowledge.rules[0] ??
        null;

      const relatedRule = ruleMeta
        ? {
            id: ruleMeta.id,
            title: ruleMeta.title,
            lessonId: ruleMeta.lessonId,
          }
        : null;

      const stageCounts = progress.reduce<Record<string, number>>(
        (acc, item) => {
          acc[item.stage] = (acc[item.stage] ?? 0) + 1;
          return acc;
        },
        {},
      );
      const learningStageSummary =
        Object.entries(stageCounts)
          .map(([stage, count]) => `${stage}:${count}`)
          .join(", ") || "UNKNOWN:0";

      return {
        reading,
        learner: {
          currentLessonId: state.profile.currentLessonId,
          currentLessonTitle: relatedLesson?.title ?? null,
          learningStageSummary,
          knownVocabulary: known,
          unknownVocabulary: unknown,
          weakVocabulary: weak,
          recentReviews,
          recentReflections,
        },
        relatedLesson,
        relatedRule,
        knowledgeRefs: input.knowledge.references,
        adaptation: options?.getAdaptation?.() ?? null,
        builtAt: new Date().toISOString(),
      };
    },
  };
}

export type ContextBuilder = ReturnType<typeof createContextBuilder>;
