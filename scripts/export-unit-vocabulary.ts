/**
 * Export clean Muallim unit vocabulary into data/curriculum for the learner page.
 */
import { mkdir, readdir, readFile, writeFile } from "fs/promises";
import path from "path";

import { isIndexableWordGloss } from "../features/knowledge/domain/vocabulary-lookup";
import { knowledgePaths } from "../features/knowledge/paths";
import type { KnowledgeExportBundle } from "../features/knowledge/types";
import { normalizeArabic } from "../features/teacher/domain/arabic";

type UnitWord = {
  id: string;
  arabic: string;
  meaning: string;
  unit: number;
};

async function loadBundles(): Promise<KnowledgeExportBundle[]> {
  const exportsDir = knowledgePaths.exports;
  const entries = await readdir(exportsDir);
  const bundles: KnowledgeExportBundle[] = [];
  for (const entry of entries) {
    try {
      const raw = await readFile(
        path.join(exportsDir, entry, "bundle.json"),
        "utf8",
      );
      bundles.push(JSON.parse(raw) as KnowledgeExportBundle);
    } catch {
      // skip
    }
  }
  return bundles;
}

async function main() {
  const bundles = await loadBundles();
  const byUnit = new Map<number, Map<string, UnitWord>>();

  for (const bundle of bundles) {
    const unitMatch = bundle.bookSlug.match(/unit-(\d+)/i);
    const unitFromSlug = unitMatch ? Number(unitMatch[1]) : null;

    for (const vocab of bundle.vocabulary) {
      const unit = vocab.unit ?? unitFromSlug;
      if (unit == null || unit < 1 || unit > 7) continue;
      if (!isIndexableWordGloss(vocab.arabic, vocab.urdu ?? "")) continue;

      const key = normalizeArabic(vocab.arabic);
      if (!key) continue;
      const map = byUnit.get(unit) ?? new Map<string, UnitWord>();
      const existing = map.get(key);
      const next: UnitWord = {
        id: vocab.id,
        arabic: vocab.arabic.trim(),
        meaning: (vocab.urdu ?? "").trim(),
        unit,
      };
      if (!existing || next.meaning.length < existing.meaning.length) {
        map.set(key, next);
      }
      byUnit.set(unit, map);
    }
  }

  const units = [1, 2, 3, 4, 5, 6, 7].map((unit) => {
    const words = [...(byUnit.get(unit)?.values() ?? [])].sort((a, b) =>
      a.arabic.localeCompare(b.arabic, "ar"),
    );
    return { unit, wordCount: words.length, words };
  });

  const out = {
    version: 1,
    builtAt: new Date().toISOString(),
    source: "knowledge/books/exports/unit-*/bundle.json",
    note: "Clean single-word Muallim glosses only — curriculum vocabulary.",
    units,
    totalWords: units.reduce((sum, item) => sum + item.wordCount, 0),
  };

  const outPath = path.join(
    process.cwd(),
    "data",
    "curriculum",
    "unit-vocabulary.json",
  );
  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(out, null, 2), "utf8");
  console.log(
    JSON.stringify(
      {
        out: outPath,
        totalWords: out.totalWords,
        byUnit: Object.fromEntries(
          units.map((item) => [item.unit, item.wordCount]),
        ),
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
