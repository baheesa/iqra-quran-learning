/**
 * Enrich learner-rules.json with extra Quran examples (+ Urdu) from unit-ayahs.
 * Keeps the curated primary example first; adds matching ayah snippets.
 */
import { readFile, writeFile } from "fs/promises";
import path from "path";

import { normalizeArabic } from "../features/teacher/domain/arabic";

const RULES_PATH = path.join(
  process.cwd(),
  "data",
  "curriculum",
  "learner-rules.json",
);
const AYAHS_PATH = path.join(
  process.cwd(),
  "data",
  "curriculum",
  "unit-ayahs.json",
);
const MAX_EXAMPLES = 6;
const MAX_EXAMPLE_LEN = 88;

type ExampleItem = {
  arabic: string;
  meaning: string | null;
};

type RuleRow = {
  id: string;
  unit: number;
  order: number;
  title: string;
  definition: string;
  example?: string;
  examples?: Array<string | ExampleItem>;
};

type AyahRow = { unit: number; arabic: string; meaning: string | null };

const ARABIC_TOKEN =
  /[\u0621-\u064A\u066E\u066F\u0671-\u06D3\u06FA-\u06FF\u064B-\u065F\u0670\u06D6-\u06EDـ]+/gu;

function tokens(arabic: string): string[] {
  return arabic.match(ARABIC_TOKEN) ?? [];
}

function asExampleItem(value: string | ExampleItem | undefined): ExampleItem | null {
  if (!value) return null;
  if (typeof value === "string") {
    const arabic = value.trim();
    return arabic ? { arabic, meaning: null } : null;
  }
  const arabic = value.arabic?.trim();
  if (!arabic) return null;
  return {
    arabic,
    meaning: value.meaning?.trim() || null,
  };
}

function titleNeedles(title: string): string[] {
  const parts = title
    .split(/[\/|،,]/u)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => part.replace(/^ـ+|ـ+$/gu, "").trim())
    .filter((part) => part.length >= 1 && part.length <= 28);

  const extras: string[] = [];
  for (const part of parts) {
    if (/هذَا|هَذَا|هذا/u.test(part)) {
      extras.push("هَذَا", "هذَا", "هذا", "هَـٰذَا");
    }
    if (/مَتَى|متى/u.test(part)) {
      extras.push("مَتَى", "متى");
    }
  }
  return [...new Set([...parts, ...extras])];
}

function ayahMatchesTitle(arabic: string, title: string): boolean {
  const needles = titleNeedles(title);
  if (needles.length === 0) return false;

  const toks = tokens(arabic);
  if (toks.length === 0) return false;

  for (const needle of needles) {
    const n = normalizeArabic(needle);
    if (!n) continue;

    if (needle === "الـ" || n === "ال") {
      if (
        toks.some(
          (t) =>
            normalizeArabic(t).startsWith("ال") && normalizeArabic(t).length >= 4,
        )
      ) {
        return true;
      }
      continue;
    }

    if (needle === "لَـ" || needle === "لَ") {
      if (
        toks.some(
          (t) =>
            /^لَ[\u0621-\u064A\u0671]/u.test(t) &&
            !/^لَا/u.test(t) &&
            !/^لَ(هُمْ|هُمُ|هُم|هُ|هَا|كُمْ|كُم|كَ|كِ|نَا|ي)/u.test(t),
        )
      ) {
        return true;
      }
      continue;
    }

    if (title.startsWith("ـ") || needle.startsWith("ـ")) {
      const suffix = normalizeArabic(needle);
      if (
        suffix &&
        toks.some(
          (t) =>
            normalizeArabic(t).endsWith(suffix) &&
            normalizeArabic(t).length > suffix.length + 1,
        )
      ) {
        return true;
      }
      continue;
    }

    if (n.length <= 4) {
      for (const t of toks) {
        const nt = normalizeArabic(t);
        if (nt === n) return true;
        if (nt.startsWith(n) && nt.length <= n.length + 8) return true;
      }
      continue;
    }

    if (normalizeArabic(arabic).includes(n)) return true;
    if (
      toks.some(
        (t) => normalizeArabic(t) === n || normalizeArabic(t).startsWith(n),
      )
    ) {
      return true;
    }
  }
  return false;
}

function dedupeKey(arabic: string): string {
  return normalizeArabic(arabic).slice(0, 48);
}

function collectExamples(rule: RuleRow, ayahs: AyahRow[]): ExampleItem[] {
  const out: ExampleItem[] = [];
  const seen = new Set<string>();
  const meaningByKey = new Map<string, string>();

  for (const ayah of ayahs) {
    const key = dedupeKey(ayah.arabic);
    if (ayah.meaning && !meaningByKey.has(key)) {
      meaningByKey.set(key, ayah.meaning);
    }
  }

  function push(arabic: string, meaning: string | null) {
    const cleaned = arabic.trim();
    if (!cleaned || cleaned.length > MAX_EXAMPLE_LEN) return;
    const key = dedupeKey(cleaned);
    if (!key || seen.has(key)) return;
    seen.add(key);
    out.push({
      arabic: cleaned,
      meaning: meaning ?? meaningByKey.get(key) ?? null,
    });
  }

  const primary =
    asExampleItem(rule.example) ??
    asExampleItem(rule.examples?.[0]);
  if (primary) push(primary.arabic, primary.meaning);

  // Keep any previously stored example meanings
  for (const raw of rule.examples ?? []) {
    const item = asExampleItem(raw);
    if (item) push(item.arabic, item.meaning);
  }

  const sameUnit = ayahs.filter((a) => a.unit === rule.unit);
  const other = ayahs.filter((a) => a.unit !== rule.unit);

  for (const pool of [sameUnit, other]) {
    for (const ayah of pool) {
      if (out.length >= MAX_EXAMPLES) break;
      if (ayahMatchesTitle(ayah.arabic, rule.title)) {
        push(ayah.arabic, ayah.meaning);
      }
    }
    if (out.length >= MAX_EXAMPLES) break;
  }

  return out.slice(0, MAX_EXAMPLES);
}

async function main() {
  const rulesFile = JSON.parse(await readFile(RULES_PATH, "utf8")) as {
    version: number;
    rules: RuleRow[];
    [key: string]: unknown;
  };
  const ayahsFile = JSON.parse(await readFile(AYAHS_PATH, "utf8")) as {
    units: Array<{
      unit: number;
      ayahs: Array<{ arabic: string; meaning?: string | null }>;
    }>;
  };

  const ayahs: AyahRow[] = [];
  for (const unit of ayahsFile.units ?? []) {
    for (const ayah of unit.ayahs ?? []) {
      if (ayah.arabic?.trim()) {
        ayahs.push({
          unit: unit.unit,
          arabic: ayah.arabic.trim(),
          meaning: ayah.meaning?.trim() || null,
        });
      }
    }
  }

  let withExtras = 0;
  let withMeaning = 0;
  const rules = rulesFile.rules.map((rule) => {
    const examples = collectExamples(rule, ayahs);
    if (examples.length > 1) withExtras += 1;
    withMeaning += examples.filter((e) => Boolean(e.meaning)).length;
    return {
      id: rule.id,
      unit: rule.unit,
      order: rule.order,
      title: rule.title,
      definition: rule.definition,
      example: examples[0]?.arabic ?? rule.example ?? undefined,
      examples,
    };
  });

  const out = {
    ...rulesFile,
    version: Math.max(Number(rulesFile.version) || 2, 4),
    builtAt: new Date().toISOString(),
    note:
      "Brief Muallim definitions with Indo-Pak Arabic examples + Urdu glosses from unit ayahs where available.",
    entryCount: rules.length,
    rules,
  };

  await writeFile(RULES_PATH, `${JSON.stringify(out, null, 2)}\n`, "utf8");
  console.log(
    JSON.stringify(
      {
        rules: rules.length,
        withMultipleExamples: withExtras,
        exampleMeanings: withMeaning,
        avgExamples:
          Math.round(
            (rules.reduce((s, r) => s + (r.examples?.length ?? 0), 0) /
              Math.max(rules.length, 1)) *
              10,
          ) / 10,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
