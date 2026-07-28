import { createLearningEngine } from "@/features/learning/create-engine";

let engine: ReturnType<typeof createLearningEngine> | null = null;

/** Server singleton — file-backed local learner (auth deferred). */
export function getLearningEngine() {
  if (!engine) {
    engine = createLearningEngine();
  }
  return engine;
}

/** Test helper */
export function resetLearningEngineForTests() {
  engine = null;
}
