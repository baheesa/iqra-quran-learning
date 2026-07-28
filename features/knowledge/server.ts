import { createKnowledgeEngine } from "@/features/knowledge/create-engine";

/** Shared server-side knowledge engine (file-backed pipeline). */
export const knowledgeEngine = createKnowledgeEngine();
