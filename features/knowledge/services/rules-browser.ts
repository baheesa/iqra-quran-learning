import { readFile } from "fs/promises";
import path from "path";

export type RuleExample = {
  arabic: string;
  meaning: string | null;
};

export type LearnerRule = {
  id: string;
  title: string;
  definition: string;
  /** Primary curated example arabic (first of examples). */
  example: string | null;
  /** Primary + extra Quran snippets with optional Urdu. */
  examples: RuleExample[];
  unit: number;
  order: number;
};

type LearnerRulesFile = {
  version: number;
  rules: Array<{
    id: string;
    unit: number;
    order: number;
    title: string;
    definition: string;
    example?: string;
    examples?: Array<string | RuleExample>;
  }>;
};

function learnerRulesPath(): string {
  return path.join(process.cwd(), "data", "curriculum", "learner-rules.json");
}

function normalizeExamples(
  example: string | undefined,
  examples: Array<string | RuleExample> | undefined,
): RuleExample[] {
  const raw: Array<string | RuleExample> = [
    ...(examples ?? []),
    ...(example ? [example] : []),
  ];

  const seen = new Set<string>();
  const out: RuleExample[] = [];
  for (const item of raw) {
    const arabic =
      typeof item === "string" ? item.trim() : item.arabic?.trim() ?? "";
    if (!arabic) continue;
    const key = arabic.replace(/\s+/g, " ");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      arabic,
      meaning:
        typeof item === "string" ? null : item.meaning?.trim() || null,
    });
  }
  return out;
}

export function sortRulesChronologically(
  rules: LearnerRule[],
): LearnerRule[] {
  return [...rules].sort((a, b) => {
    if (a.unit !== b.unit) return a.unit - b.unit;
    return a.order - b.order;
  });
}

/**
 * Load brief Muallim rules for revision (unit → chronological).
 * Prefers distilled learner-rules.json (no questions / page noise).
 */
export async function loadMuallimRulesChronological(): Promise<LearnerRule[]> {
  try {
    const raw = await readFile(learnerRulesPath(), "utf8");
    const file = JSON.parse(raw) as LearnerRulesFile;
    const rules = (file.rules ?? [])
      .filter(
        (item) =>
          item.unit >= 1 &&
          item.unit <= 7 &&
          Boolean(item.title?.trim()) &&
          Boolean(item.definition?.trim()) &&
          !/^سوال/u.test(item.definition),
      )
      .map((item) => {
        const examples = normalizeExamples(item.example, item.examples);
        return {
          id: item.id,
          title: item.title.trim(),
          definition: item.definition.trim(),
          example: examples[0]?.arabic ?? null,
          examples,
          unit: item.unit,
          order: item.order,
        };
      });
    return sortRulesChronologically(rules);
  } catch {
    return [];
  }
}

export function groupRulesByUnit(
  rules: LearnerRule[],
): { unit: number; rules: LearnerRule[] }[] {
  const map = new Map<number, LearnerRule[]>();
  for (const rule of rules) {
    const list = map.get(rule.unit) ?? [];
    list.push(rule);
    map.set(rule.unit, list);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a - b)
    .map(([unit, unitRules]) => ({ unit, rules: unitRules }));
}
