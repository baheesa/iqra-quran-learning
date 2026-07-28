import { getLearningEngine } from "@/features/learning/server";
import { createPersonalizationEngine } from "@/features/personalization/create-engine";

let engine: ReturnType<typeof createPersonalizationEngine> | null = null;

export function getPersonalizationEngine() {
  if (!engine) {
    engine = createPersonalizationEngine({
      learning: getLearningEngine(),
    });
  }
  return engine;
}

export function resetPersonalizationEngineForTests() {
  engine = null;
}
