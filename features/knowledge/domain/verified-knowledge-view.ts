import type { KnowledgeLookupResult } from "@/features/knowledge/domain/vocabulary-lookup";

export const VERIFIED_KNOWLEDGE_LABEL = "✓ معلم القرآن";
export const AI_EXPLANATION_LABEL = "AI وضاحت";

export type VerifiedKnowledgeField = {
  label: string;
  value: string;
  quran?: boolean;
};

/**
 * Pure view-model for the verified knowledge popup (testable without JSX).
 * Meaning first; qaida only when a real rule exists — never invents content.
 */
export function buildVerifiedKnowledgeFields(
  result: KnowledgeLookupResult,
): VerifiedKnowledgeField[] {
  if (!result.found) {
    return [];
  }

  const fields: VerifiedKnowledgeField[] = [];

  if (result.meaning) {
    fields.push({
      label: "معنی",
      value: result.meaning,
      quran: false,
    });
  }

  const qaida =
    result.grammar ??
    (result.rule && !/صفحہ\s*\d+/u.test(result.rule) ? result.rule : null);
  if (qaida) {
    fields.push({
      label: "قاعدہ",
      value: qaida,
      quran: /[\u0600-\u06FF]/.test(qaida),
    });
  }

  return fields;
}
