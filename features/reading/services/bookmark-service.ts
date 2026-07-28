import { STORAGE_KEYS } from "@/features/reading/constants";
import type { StorageAdapter } from "@/lib/storage/adapter";
import type { BookmarkRecord } from "@/types/quran";

function parseBookmarks(value: string | null): BookmarkRecord[] {
  if (!value) {
    return [];
  }

  try {
    return JSON.parse(value) as BookmarkRecord[];
  } catch {
    return [];
  }
}

export function createBookmarkService(storage: StorageAdapter) {
  return {
    list(): BookmarkRecord[] {
      return parseBookmarks(storage.getItem(STORAGE_KEYS.bookmarks)).sort(
        (a, b) => b.createdAt.localeCompare(a.createdAt),
      );
    },

    isBookmarked(page: number): boolean {
      return this.list().some((bookmark) => bookmark.page === page);
    },

    add(input: {
      page: number;
      juz: number;
      surahId: number;
      ayahNumber: number;
      title: string;
      note?: string;
    }): BookmarkRecord {
      const existing = this.list();
      const already = existing.find((bookmark) => bookmark.page === input.page);
      if (already) {
        return already;
      }

      const bookmark: BookmarkRecord = {
        id: `bm-${input.page}-${Date.now()}`,
        page: input.page,
        juz: input.juz,
        surahId: input.surahId,
        ayahNumber: input.ayahNumber,
        title: input.title,
        createdAt: new Date().toISOString(),
        ...(input.note ? { note: input.note } : {}),
      };

      storage.setItem(
        STORAGE_KEYS.bookmarks,
        JSON.stringify([bookmark, ...existing]),
      );
      return bookmark;
    },

    remove(page: number): void {
      const next = this.list().filter((bookmark) => bookmark.page !== page);
      storage.setItem(STORAGE_KEYS.bookmarks, JSON.stringify(next));
    },

    toggle(input: {
      page: number;
      juz: number;
      surahId: number;
      ayahNumber: number;
      title: string;
    }): { bookmarked: boolean; bookmarks: BookmarkRecord[] } {
      if (this.isBookmarked(input.page)) {
        this.remove(input.page);
        return { bookmarked: false, bookmarks: this.list() };
      }

      this.add(input);
      return { bookmarked: true, bookmarks: this.list() };
    },
  };
}

export type BookmarkService = ReturnType<typeof createBookmarkService>;
