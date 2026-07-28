import { describe, expect, it } from "vitest";

import {
  VERIFIED_KNOWLEDGE_LABEL,
  buildVerifiedKnowledgeFields,
} from "@/features/knowledge/domain/verified-knowledge-view";
import type { KnowledgeLookupResult } from "@/features/knowledge/domain/vocabulary-lookup";
import { UNKNOWN_WORD_MESSAGE } from "@/features/knowledge/domain/vocabulary-lookup";

describe("verified knowledge popup view-model", () => {
  it("shows meaning and optional qaida only — no metadata noise", () => {
    const result: KnowledgeLookupResult = {
      found: true,
      word: "يرجون",
      meaning: "امید رکھتے ہیں",
      arabic: "يَرْجُونَ",
      root: "يَرْجُو",
      lesson: "Unit 2",
      unit: 2,
      grammar: "فعل حال — جمع",
      rule: "جمع مذکر",
      explanation: "مختصر وضاحت",
      references: ["يَرْجُونَ رَحْمَةَ اللَّهِ"],
      difficulty: null,
      occurrences: 1,
      page: 14,
      bookSlug: "unit-2",
      vocabularyId: "v1",
      source: "muallim_approved",
      message: null,
    };

    const fields = buildVerifiedKnowledgeFields(result);
    const labels = fields.map((item) => item.label);

    expect(VERIFIED_KNOWLEDGE_LABEL).toContain("معلم القرآن");
    expect(labels).toEqual(["معنی", "قاعدہ"]);
    expect(labels).not.toContain("عربی");
    expect(labels).not.toContain("جذر حروف");
    expect(labels).not.toContain("متعلقہ قرآنی حوالہ");
    expect(labels).not.toContain("سبق");
    expect(labels).not.toContain("صفحہ");

    const rule = fields.find((item) => item.label === "قاعدہ");
    expect(rule?.value).toBe("فعل حال — جمع");
  });

  it("shows only meaning when no qaida exists", () => {
    const result: KnowledgeLookupResult = {
      found: true,
      word: "رب",
      meaning: "پروردگار",
      arabic: "رَبِّ",
      root: null,
      lesson: null,
      unit: null,
      grammar: null,
      rule: "قاعدہ — صفحہ 12",
      explanation: null,
      references: [],
      difficulty: null,
      occurrences: 1,
      page: 12,
      bookSlug: "unit-1",
      vocabularyId: "v2",
      source: "muallim_approved",
      message: null,
    };

    const fields = buildVerifiedKnowledgeFields(result);
    expect(fields.map((item) => item.label)).toEqual(["معنی"]);
    expect(fields[0]?.value).toBe("پروردگار");
  });

  it("returns no invented fields for unknown words", () => {
    const result: KnowledgeLookupResult = {
      found: false,
      word: "xyz",
      meaning: null,
      arabic: null,
      root: null,
      lesson: null,
      unit: null,
      grammar: null,
      rule: null,
      explanation: null,
      references: [],
      difficulty: null,
      occurrences: null,
      page: null,
      bookSlug: null,
      vocabularyId: null,
      source: null,
      message: UNKNOWN_WORD_MESSAGE,
    };

    expect(buildVerifiedKnowledgeFields(result)).toEqual([]);
    expect(result.message).toBe(UNKNOWN_WORD_MESSAGE);
  });
});
