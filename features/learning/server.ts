import { createLearningEngine } from "@/features/learning/create-engine";

let engine: ReturnType<typeof createLearningEngine> | null = null;

/**
 * Server singleton for the Learning Engine.
 * On Vercel (and other read-only hosts) use memory — serverless cannot write
 * data/learner/*.json. Browser localStorage still tracks learner progress.
 */
export function getLearningEngine() {
  if (!engine) {
    const useMemory =
      process.env.VERCEL === "1" ||
      process.env.LEARNING_STORE === "memory" ||
      process.env.AUTH_PROVIDER === "memory";
    engine = createLearningEngine({ useMemory });
  }
  return engine;
}

/** Test helper */
export function resetLearningEngineForTests() {
  engine = null;
}
