import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { tokenMatchesArabicForm, tokenMatchesSearch } from "./highlight";
import { buildMatchList } from "./quran-search";

const index = JSON.parse(
  readFileSync(
    "offline-apk/public/data/quran/word-search-index.json",
    "utf8",
  ),
).forms as Record<string, Array<{ p: number; a: string; w: string; ar: string }>>;

const ayahCards = JSON.parse(
  readFileSync("offline-apk/public/data/quran/ayah-cards.json", "utf8"),
).ayahs as Record<string, { p: number; ar: string; ur: string }>;

describe("buildMatchList phrase highlighting", () => {
  it("stores every phrase word so View-all can highlight all of them", () => {
    const { items } = buildMatchList("رب العالمين", index, ayahCards, 20);
    const m = items.find((i) => i.ayahId === "1:2");
    expect(m).toBeTruthy();
    expect(m!.matchedForms?.length).toBeGreaterThanOrEqual(2);
    const marked = m!.arabic
      .split(/\s+/u)
      .filter(
        (tok) =>
          tokenMatchesArabicForm(tok, m!.matchedForms) ||
          tokenMatchesSearch(tok, "رب العالمين"),
      );
    expect(marked).toContain("رَبِّ");
    expect(marked).toContain("ٱلْعَٰلَمِينَ");
  });
});
