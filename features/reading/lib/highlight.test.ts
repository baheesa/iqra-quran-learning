import { describe, expect, it } from "vitest";

import { tokenMatchesArabicForm, tokenMatchesSearch } from "./highlight";

describe("tokenMatchesSearch", () => {
  it("matches each word in a multi-word Arabic query", () => {
    const query = "رب العالمين";
    expect(tokenMatchesSearch("رَبِّ", query)).toBe(true);
    expect(tokenMatchesSearch("الْعَالَمِينَ", query)).toBe(true);
    expect(tokenMatchesSearch("الرَّحْمَٰنِ", query)).toBe(false);
  });

  it("matches dagger-alef variants in multi-word queries", () => {
    const query = "رب العالمين";
    // Mushaf form without written ا (dagger-alef dropped after strip)
    expect(tokenMatchesSearch("العلمين", query)).toBe(true);
  });

  it("marks both words in 1:2 for رب العالمين", () => {
    const ayah = "ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ";
    const query = "رب العالمين";
    const toks = ayah.split(/\s+/u);
    const hits = toks.filter((t) => tokenMatchesSearch(t, query));
    expect(hits).toEqual(["رَبِّ", "ٱلْعَٰلَمِينَ"]);
  });
});

describe("tokenMatchesArabicForm phrase forms", () => {
  it("marks every form returned from a phrase search chain", () => {
    const forms = ["رَبِّ", "ٱلْعَٰلَمِينَ"];
    expect(tokenMatchesArabicForm("رَبِّ", forms)).toBe(true);
    expect(tokenMatchesArabicForm("ٱلْعَٰلَمِينَ", forms)).toBe(true);
    expect(tokenMatchesArabicForm("ٱلْحَمْدُ", forms)).toBe(false);
  });
});
