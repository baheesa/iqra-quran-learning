import { describe, expect, it } from "vitest";

import { lookupWordInSeed } from "@/features/reading/services/word-knowledge";

describe("word knowledge lookup", () => {
  it("finds seed meaning for بسم", () => {
    const hit = lookupWordInSeed("بِسْمِ");
    expect(hit?.urduMeaning).toBe("نام سے");
    expect(hit?.lessonTitle).toContain("سبق");
    expect(hit?.source).toBe("curriculum_seed");
  });

  it("finds رب without inventing", () => {
    const hit = lookupWordInSeed("رَبِّ");
    expect(hit?.urduMeaning).toBe("پروردگار");
    expect(hit?.ruleTitle).toBeTruthy();
  });

  it("returns null for unknown words", () => {
    expect(lookupWordInSeed("قِطْمِيرٍ")).toBeNull();
  });
});
