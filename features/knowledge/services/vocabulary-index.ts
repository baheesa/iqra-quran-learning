import { mkdir, readFile, readdir, writeFile } from "fs/promises";
import path from "path";

import {
  buildVocabularyIndexFromBundles,
  lookupInIndex,
  toLookupResult,
  type KnowledgeLookupResult,
  type VocabularyIndexFile,
} from "@/features/knowledge/domain/vocabulary-lookup";
import { knowledgePaths } from "@/features/knowledge/paths";
import type { KnowledgeExportBundle } from "@/features/knowledge/types";

export type {
  KnowledgeLookupResult,
  VocabularyIndexEntry,
  VocabularyIndexFile,
} from "@/features/knowledge/domain/vocabulary-lookup";

export {
  buildVocabularyIndexFromBundles,
  lookupInIndex,
  toLookupApiPayload,
  toLookupResult,
  UNKNOWN_WORD_MESSAGE,
} from "@/features/knowledge/domain/vocabulary-lookup";

const INDEX_FILE = "vocabulary-index.json";

let memoryIndex: VocabularyIndexFile | null = null;

export function vocabularyIndexPath(
  exportsDir = knowledgePaths.exports,
): string {
  return path.join(exportsDir, INDEX_FILE);
}

export function clearVocabularyIndexCache(): void {
  memoryIndex = null;
}

export async function loadExportBundles(
  exportsDir = knowledgePaths.exports,
): Promise<KnowledgeExportBundle[]> {
  const bundles: KnowledgeExportBundle[] = [];
  let entries: string[] = [];
  try {
    entries = await readdir(exportsDir);
  } catch {
    return bundles;
  }

  for (const entry of entries) {
    if (entry === INDEX_FILE || entry.endsWith("-index.json")) continue;
    const nested = path.join(exportsDir, entry, "bundle.json");
    try {
      const raw = await readFile(nested, "utf8");
      bundles.push(JSON.parse(raw) as KnowledgeExportBundle);
      continue;
    } catch {
      // try flat json file
    }
    if (!entry.endsWith(".json")) continue;
    try {
      const raw = await readFile(path.join(exportsDir, entry), "utf8");
      const parsed = JSON.parse(raw) as KnowledgeExportBundle;
      if (parsed && Array.isArray(parsed.vocabulary) && parsed.bookSlug) {
        bundles.push(parsed);
      }
    } catch {
      // skip invalid export files
    }
  }

  return bundles;
}

export async function rebuildVocabularyIndex(
  exportsDir = knowledgePaths.exports,
): Promise<VocabularyIndexFile> {
  const bundles = await loadExportBundles(exportsDir);
  const index = buildVocabularyIndexFromBundles(bundles);
  await mkdir(exportsDir, { recursive: true });
  await writeFile(
    vocabularyIndexPath(exportsDir),
    JSON.stringify(index, null, 2),
    "utf8",
  );
  memoryIndex = index;
  return index;
}

export async function loadVocabularyIndex(
  exportsDir = knowledgePaths.exports,
): Promise<VocabularyIndexFile> {
  if (memoryIndex) {
    return memoryIndex;
  }
  try {
    const raw = await readFile(vocabularyIndexPath(exportsDir), "utf8");
    memoryIndex = JSON.parse(raw) as VocabularyIndexFile;
    return memoryIndex;
  } catch {
    return rebuildVocabularyIndex(exportsDir);
  }
}

export async function lookupVerifiedWord(
  word: string,
  exportsDir = knowledgePaths.exports,
): Promise<KnowledgeLookupResult> {
  const index = await loadVocabularyIndex(exportsDir);
  return toLookupResult(word, lookupInIndex(index, word));
}
