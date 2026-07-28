import { getLearningEngine } from "@/features/learning/server";
import { getPersonalizationEngine } from "@/features/personalization/server";
import { createTeacherEngine } from "@/features/teacher/create-engine";

let engine: ReturnType<typeof createTeacherEngine> | null = null;

export function getTeacherEngine() {
  if (!engine) {
    const learning = getLearningEngine();
    const personalization = getPersonalizationEngine();
    engine = createTeacherEngine({
      learning,
      adaptation: personalization.adaptation,
    });
  }
  return engine;
}

export function resetTeacherEngineForTests() {
  engine = null;
}
