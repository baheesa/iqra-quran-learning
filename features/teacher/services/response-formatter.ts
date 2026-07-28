import type { TeacherResponse } from "@/features/teacher/types";

/**
 * Normalizes teacher output for the UI (trim, ensure encouragement cue).
 */
export function createResponseFormatter() {
  return {
    format(input: { answer: string; encourageReading?: boolean }): {
      answer: string;
      encourageReading: boolean;
    } {
      let answer = input.answer.trim();
      const encourageReading =
        input.encourageReading ?? /پڑھ|قراءت|جاری/.test(answer);

      if (!encourageReading) {
        answer = `${answer}\n\nاب قرآن کی طرف واپس جائیں۔`;
      }

      // Soft length guard for UI calmness
      if (answer.length > 1800) {
        answer = `${answer.slice(0, 1800)}…`;
      }

      return { answer, encourageReading: true };
    },

    toPanelPayload(response: TeacherResponse) {
      return {
        answer: response.answer,
        relatedLesson: response.relatedLesson,
        relatedRule: response.relatedRule,
        vocabularyStatus: response.vocabularyStatus,
        suggestions: response.suggestions,
        knowledgeRefs: response.knowledgeRefs,
        usedMuallimKnowledge: response.usedMuallimKnowledge,
        encourageReading: response.encourageReading,
      };
    },
  };
}

export type ResponseFormatter = ReturnType<typeof createResponseFormatter>;
