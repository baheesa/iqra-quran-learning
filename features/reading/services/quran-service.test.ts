import { describe, expect, it } from "vitest";

import {
  QURAN_JUZ_COUNT,
  QURAN_PAGE_COUNT,
  QURAN_SURAH_COUNT,
} from "@/features/reading/constants";
import {
  getJuzIndex,
  getQuranMeta,
  getQuranPage,
  getSurahs,
} from "@/features/reading/services/quran-service";

describe("quran service", () => {
  it("loads meta matching expected mushaf size", async () => {
    const meta = await getQuranMeta();
    expect(meta.pageCount).toBe(QURAN_PAGE_COUNT);
    expect(meta.surahCount).toBe(QURAN_SURAH_COUNT);
  });

  it("loads all surahs with start pages", async () => {
    const surahs = await getSurahs();
    expect(surahs).toHaveLength(QURAN_SURAH_COUNT);
    expect(surahs[0]?.startPage).toBe(1);
    expect(surahs[113]?.id).toBe(114);
  });

  it("loads juz index for 30 juz", async () => {
    const juzIndex = await getJuzIndex();
    expect(juzIndex).toHaveLength(QURAN_JUZ_COUNT);
    expect(juzIndex[0]?.startPage).toBe(1);
  });

  it("loads page 1 with selectable words", async () => {
    const page = await getQuranPage(1);
    expect(page.page).toBe(1);
    expect(page.ayahs.length).toBeGreaterThan(0);
    expect(page.ayahs[0]?.words[0]?.id).toMatch(/^\d+:\d+:\d+$/);
  });

  it("rejects invalid pages", async () => {
    await expect(getQuranPage(0)).rejects.toThrow(/Invalid Quran page/);
    await expect(getQuranPage(605)).rejects.toThrow(/Invalid Quran page/);
  });
});
