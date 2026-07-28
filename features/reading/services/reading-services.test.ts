import { describe, expect, it } from "vitest";

import { createBookmarkService } from "@/features/reading/services/bookmark-service";
import { createProgressService } from "@/features/reading/services/progress-service";
import { createReadingService } from "@/features/reading/services/reading-service";
import { createMemoryStorage } from "@/lib/storage/adapter";
import type { QuranPageData } from "@/types/quran";

function samplePage(page = 1): QuranPageData {
  return {
    page,
    juz: 1,
    surahIds: [1],
    ayahs: [
      {
        id: "1:1",
        surahId: 1,
        ayahNumber: 1,
        globalNumber: 1,
        juz: 1,
        page,
        text: "بِسْمِ ٱللَّهِ",
        words: [
          { id: "1:1:1", position: 1, arabic: "بِسْمِ" },
          { id: "1:1:2", position: 2, arabic: "ٱللَّهِ" },
        ],
      },
    ],
  };
}

describe("progress service", () => {
  it("stores and resumes reading position", () => {
    const progress = createProgressService(createMemoryStorage());
    progress.setPosition({
      page: 2,
      juz: 1,
      surahId: 2,
      ayahNumber: 1,
    });

    const position = progress.getPosition();
    expect(position?.page).toBe(2);
    expect(position?.surahId).toBe(2);
  });

  it("keeps recent reading history without duplicate pages", () => {
    const progress = createProgressService(createMemoryStorage());
    progress.setPosition({ page: 1, juz: 1, surahId: 1, ayahNumber: 1 });
    progress.setPosition({ page: 2, juz: 1, surahId: 2, ayahNumber: 1 });
    progress.setPosition({ page: 1, juz: 1, surahId: 1, ayahNumber: 1 });

    const history = progress.getHistory();
    expect(history[0]?.page).toBe(1);
    expect(history.filter((entry) => entry.page === 1)).toHaveLength(1);
    expect(history).toHaveLength(2);
  });

  it("tracks unique visited pages for journey percent", () => {
    const progress = createProgressService(createMemoryStorage());
    progress.setPosition({ page: 1, juz: 1, surahId: 1, ayahNumber: 1 });
    progress.setPosition({ page: 3, juz: 1, surahId: 2, ayahNumber: 1 });
    progress.setPosition({ page: 1, juz: 1, surahId: 1, ayahNumber: 1 });

    expect(progress.getVisitedPages()).toEqual([1, 3]);
  });
});

describe("bookmark service", () => {
  it("adds, lists, and removes bookmarks", () => {
    const bookmarks = createBookmarkService(createMemoryStorage());
    bookmarks.add({
      page: 5,
      juz: 1,
      surahId: 2,
      ayahNumber: 1,
      title: "صفحہ ۵",
    });

    expect(bookmarks.isBookmarked(5)).toBe(true);
    expect(bookmarks.list()).toHaveLength(1);

    bookmarks.remove(5);
    expect(bookmarks.isBookmarked(5)).toBe(false);
  });

  it("toggles bookmark state", () => {
    const bookmarks = createBookmarkService(createMemoryStorage());
    const first = bookmarks.toggle({
      page: 3,
      juz: 1,
      surahId: 2,
      ayahNumber: 1,
      title: "صفحہ ۳",
    });
    expect(first.bookmarked).toBe(true);

    const second = bookmarks.toggle({
      page: 3,
      juz: 1,
      surahId: 2,
      ayahNumber: 1,
      title: "صفحہ ۳",
    });
    expect(second.bookmarked).toBe(false);
  });
});

describe("reading service", () => {
  it("remembers page through progress service", () => {
    const storage = createMemoryStorage();
    const reading = createReadingService({
      progress: createProgressService(storage),
      bookmarks: createBookmarkService(storage),
    });

    const position = reading.rememberPage(samplePage(7));
    expect(position.page).toBe(7);
    expect(reading.resumePosition()?.page).toBe(7);
  });

  it("toggles bookmarks for a page", () => {
    const storage = createMemoryStorage();
    const reading = createReadingService({
      progress: createProgressService(storage),
      bookmarks: createBookmarkService(storage),
    });

    const page = samplePage(9);
    expect(reading.toggleBookmark(page, "ٹیسٹ").bookmarked).toBe(true);
    expect(reading.isBookmarked(9)).toBe(true);
    expect(reading.toggleBookmark(page, "ٹیسٹ").bookmarked).toBe(false);
  });
});
