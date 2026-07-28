import { createAdminEngine } from "@/features/admin/create-engine";
import { knowledgeEngine } from "@/features/knowledge/server";

let engine: ReturnType<typeof createAdminEngine> | null = null;

export function getAdminEngine() {
  if (!engine) {
    const useMemory =
      process.env.ADMIN_PROVIDER === "memory" ||
      process.env.NODE_ENV === "test";
    engine = createAdminEngine({
      useMemory,
      knowledge: useMemory ? undefined : knowledgeEngine,
    });
  }
  return engine;
}

export function resetAdminEngineForTests() {
  engine = null;
}
