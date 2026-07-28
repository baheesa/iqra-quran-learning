import type { BookmarkService } from "@/features/reading/services/bookmark-service";
import type { ProgressService } from "@/features/reading/services/progress-service";
import type { QuranPageData, ReadingPosition } from "@/types/quran";

/**
 * Orchestrates reading actions used by the UI.
 * Quran content comes from QuranService / API; progress & bookmarks from adapters.
 */
export function createReadingService(deps: {
  progress: ProgressService;
  bookmarks: BookmarkService;
}) {
  return {
    resumePosition(): ReadingPosition | null {
      return deps.progress.getPosition();
    },

    rememberPage(page: QuranPageData): ReadingPosition {
      const firstAyah = page.ayahs[0];
      if (!firstAyah) {
        throw new Error(`Page ${page.page} has no ayahs`);
      }

      return deps.progress.setPosition({
        page: page.page,
        juz: page.juz,
        surahId: firstAyah.surahId,
        ayahNumber: firstAyah.ayahNumber,
      });
    },

    listBookmarks() {
      return deps.bookmarks.list();
    },

    toggleBookmark(page: QuranPageData, title: string) {
      const firstAyah = page.ayahs[0];
      if (!firstAyah) {
        throw new Error(`Page ${page.page} has no ayahs`);
      }

      return deps.bookmarks.toggle({
        page: page.page,
        juz: page.juz,
        surahId: firstAyah.surahId,
        ayahNumber: firstAyah.ayahNumber,
        title,
      });
    },

    isBookmarked(page: number) {
      return deps.bookmarks.isBookmarked(page);
    },
  };
}

export type ReadingService = ReturnType<typeof createReadingService>;
