import type { TeacherContext } from "@/features/teacher/types";

export function createSuggestionService() {
  return {
    suggest(context: TeacherContext): string[] {
      const suggestions: string[] = [];

      if (context.learner.weakVocabulary[0]) {
        suggestions.push(
          `نظرثانی: ${context.learner.weakVocabulary[0].arabic}`,
        );
      }

      if (context.learner.recentReviews[0]) {
        suggestions.push(
          `آج کی نظرثانی میں: ${context.learner.recentReviews[0].arabic}`,
        );
      }

      if (context.relatedLesson) {
        suggestions.push(`سبق جاری رکھیں: ${context.relatedLesson.title}`);
      }

      suggestions.push("قرآن پڑھنا جاری رکھیں");

      return suggestions.slice(0, 4);
    },
  };
}

export type SuggestionService = ReturnType<typeof createSuggestionService>;
