import { mkdir, readFile, writeFile, mkdtemp, rm } from "fs/promises";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  UNKNOWN_WORD_MESSAGE,
  buildVocabularyIndexFromBundles,
  lookupInIndex,
  toLookupResult,
} from "@/features/knowledge/domain/vocabulary-lookup";
import {
  clearVocabularyIndexCache,
  lookupVerifiedWord,
  rebuildVocabularyIndex,
} from "@/features/knowledge/services/vocabulary-index";
import type { KnowledgeExportBundle } from "@/features/knowledge/types";
import {
  arabicLookupCandidates,
  normalizeArabic,
} from "@/features/teacher/domain/arabic";

function sampleBundle(): KnowledgeExportBundle {
  const now = new Date().toISOString();
  const base = {
    bookId: "b1",
    bookSlug: "unit-2",
    pageNumber: 14,
    lesson: 1,
    sourceImage: null,
    confidence: 0.95,
    verificationStatus: "APPROVED" as const,
    createdAt: now,
    version: "1",
  };

  return {
    bookSlug: "unit-2",
    exportedAt: now,
    lessons: [
      {
        ...base,
        id: "l1",
        title: "Unit 2 سبق 1",
        lessonNumber: 1,
        unit: 2,
        objectives: [],
        page: 14,
        verified: true,
      },
    ],
    vocabulary: [
      {
        ...base,
        id: "v1",
        arabic: "يَرْجُونَ",
        urdu: "امید رکھتے ہیں",
        unit: 2,
        page: 14,
        verified: true,
      },
      {
        ...base,
        id: "v2",
        pageNumber: 15,
        page: 15,
        arabic: "رَبِّ الْعَالَمِينَ",
        urdu: "تمام جہانوں کا رب",
        unit: 2,
        verified: true,
      },
    ],
    rules: [
      {
        ...base,
        id: "r1",
        title: "جمع مذکر",
        explanation: "جمع مذکر غائب کی علامت",
        examples: ["يَرْجُونَ"],
        unit: 2,
        page: 14,
        verified: true,
      },
    ],
    exercises: [],
  };
}

describe("Arabic normalization for lookup", () => {
  it("matches exact, without tashkeel, and Unicode variants", () => {
    expect(normalizeArabic("يَرْجُونَ")).toBe(normalizeArabic("يرجون"));
    expect(normalizeArabic("أَلِف")).toBe(normalizeArabic("الف"));
    expect(normalizeArabic("رحمة")).toBe(normalizeArabic("رحمه"));
    expect(normalizeArabic("على")).toBe(normalizeArabic("علي"));
  });

  it("builds prefix-stripped candidates without inventing meanings", () => {
    const keys = arabicLookupCandidates("ٱلرَّحْمَٰنِ");
    expect(keys).toContain(normalizeArabic("الرحمن"));
    expect(keys).toContain(normalizeArabic("رحمن"));
    expect(arabicLookupCandidates("وبالكتاب")).toContain(
      normalizeArabic("كتاب"),
    );
  });
});

describe("vocabulary index", () => {
  it("builds published index and looks up O(1) by normalized key", () => {
    const index = buildVocabularyIndexFromBundles([sampleBundle()]);
    expect(index.entryCount).toBeGreaterThan(0);

    const hit = lookupInIndex(index, "يرجون");
    expect(hit).not.toBeNull();
    expect(hit?.meaning).toBe("امید رکھتے ہیں");
    expect(hit?.lesson).toContain("Unit 2");
    expect(hit?.rule).toBe("جمع مذکر");
    expect(hit?.page).toBe(14);

    const withMarks = lookupInIndex(index, "يَرْجُونَ");
    expect(withMarks?.vocabularyId).toBe("v1");
  });

  it("indexes single-word lemmas only — not sibling tokens from phrases", () => {
    const index = buildVocabularyIndexFromBundles([sampleBundle()]);
    expect(lookupInIndex(index, "العالمين")).toBeNull();

    const withLemma = sampleBundle();
    withLemma.vocabulary.push({
      ...withLemma.vocabulary[0]!,
      id: "v3",
      arabic: "الْعَالَمِينَ",
      urdu: "تمام جہانوں والے",
    });
    const index2 = buildVocabularyIndexFromBundles([withLemma]);
    expect(lookupInIndex(index2, "ٱلْعَٰلَمِينَ")?.meaning).toBe(
      "تمام جہانوں والے",
    );
  });

  it("matches Quran surface forms via alif-lam stripping", () => {
    const bundle = sampleBundle();
    bundle.vocabulary.push({
      ...bundle.vocabulary[0]!,
      id: "v3",
      arabic: "الْعَالَمِينَ",
      urdu: "تمام جہانوں والے",
    });
    const index = buildVocabularyIndexFromBundles([bundle]);
    const hit = lookupInIndex(index, "ٱلْعَٰلَمِينَ");
    expect(hit?.meaning).toBe("تمام جہانوں والے");
  });

  it("prefers short clean glosses over sentence demos", () => {
    const bundle = sampleBundle();
    bundle.vocabulary.push(
      {
        ...bundle.vocabulary[0]!,
        id: "v-bad",
        arabic: "اللهُ",
        urdu: "اللہ معاف کرتا ہے",
      },
      {
        ...bundle.vocabulary[0]!,
        id: "v-good",
        arabic: "اللَّه",
        urdu: "اللہ",
      },
    );
    const index = buildVocabularyIndexFromBundles([bundle]);
    expect(lookupInIndex(index, "ٱللَّهِ")?.meaning).toBe("اللہ");
  });

  it("does not index Urdu prose stored in the arabic field", () => {
    const polluted = sampleBundle();
    polluted.vocabulary.push({
      ...polluted.vocabulary[0]!,
      id: "v-bad",
      arabic: "میرے رب سے",
      urdu: "مِنْ رَبِّي",
    });
    const index = buildVocabularyIndexFromBundles([polluted]);
    expect(lookupInIndex(index, "رب")?.vocabularyId).not.toBe("v-bad");
  });

  it("returns unknown message without inventing meaning", () => {
    const index = buildVocabularyIndexFromBundles([sampleBundle()]);
    const result = toLookupResult("كلمة", lookupInIndex(index, "كلمة"));
    expect(result.found).toBe(false);
    expect(result.meaning).toBeNull();
    expect(result.message).toBe(UNKNOWN_WORD_MESSAGE);
  });
});

describe("published vocabulary index IO", () => {
  let tempExports: string;

  beforeEach(async () => {
    clearVocabularyIndexCache();
    tempExports = await mkdtemp(path.join(os.tmpdir(), "vocab-exports-"));
    await mkdir(path.join(tempExports, "unit-2"), { recursive: true });
    await writeFile(
      path.join(tempExports, "unit-2", "bundle.json"),
      JSON.stringify(sampleBundle()),
      "utf8",
    );
  });

  afterEach(async () => {
    clearVocabularyIndexCache();
    await rm(tempExports, { recursive: true, force: true });
  });

  it("rebuilds vocabulary-index.json and supports lookup", async () => {
    const index = await rebuildVocabularyIndex(tempExports);
    expect(index.entryCount).toBeGreaterThan(0);

    const onDisk = JSON.parse(
      await readFile(path.join(tempExports, "vocabulary-index.json"), "utf8"),
    ) as { entryCount: number };
    expect(onDisk.entryCount).toBe(index.entryCount);

    const result = await lookupVerifiedWord("يرجون", tempExports);
    expect(result.found).toBe(true);
    expect(result.meaning).toBe("امید رکھتے ہیں");
    expect(result.source).toBe("muallim_approved");

    const missing = await lookupVerifiedWord("xyz", tempExports);
    expect(missing.found).toBe(false);
    expect(missing.message).toBe(UNKNOWN_WORD_MESSAGE);
  });
});
