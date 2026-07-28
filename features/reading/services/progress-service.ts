import {
  MAX_READING_HISTORY,
  QURAN_PAGE_COUNT,
  STORAGE_KEYS,
} from "@/features/reading/constants";
import type { StorageAdapter } from "@/lib/storage/adapter";
import type { ReadingHistoryEntry, ReadingPosition } from "@/types/quran";

function parseJson<T>(value: string | null, fallback: T): T {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function parseVisitedPages(raw: string | null): number[] {
  const parsed = parseJson<number[]>(raw, []);
  if (!Array.isArray(parsed)) return [];
  return [
    ...new Set(
      parsed.filter(
        (p) => Number.isInteger(p) && p >= 1 && p <= QURAN_PAGE_COUNT,
      ),
    ),
  ].sort((a, b) => a - b);
}

export function createProgressService(storage: StorageAdapter) {
  return {
    getPosition(): ReadingPosition | null {
      return parseJson<ReadingPosition | null>(
        storage.getItem(STORAGE_KEYS.readingPosition),
        null,
      );
    },

    setPosition(position: Omit<ReadingPosition, "updatedAt">): ReadingPosition {
      const next: ReadingPosition = {
        ...position,
        updatedAt: new Date().toISOString(),
      };
      storage.setItem(STORAGE_KEYS.readingPosition, JSON.stringify(next));

      const history = this.getHistory();
      const entry: ReadingHistoryEntry = {
        id: `${next.page}-${next.updatedAt}`,
        page: next.page,
        juz: next.juz,
        surahId: next.surahId,
        ayahNumber: next.ayahNumber,
        visitedAt: next.updatedAt,
      };

      const deduped = [
        entry,
        ...history.filter((item) => item.page !== next.page),
      ].slice(0, MAX_READING_HISTORY);

      storage.setItem(STORAGE_KEYS.readingHistory, JSON.stringify(deduped));
      this.markPageVisited(next.page);
      return next;
    },

    getHistory(): ReadingHistoryEntry[] {
      return parseJson<ReadingHistoryEntry[]>(
        storage.getItem(STORAGE_KEYS.readingHistory),
        [],
      );
    },

    /** Unique pages opened across the full mushaf (not capped at recent history). */
    getVisitedPages(): number[] {
      const stored = parseVisitedPages(
        storage.getItem(STORAGE_KEYS.visitedPages),
      );
      if (stored.length > 0) return stored;

      // Migrate from recent history for existing learners.
      const fromHistory = [
        ...new Set(this.getHistory().map((h) => h.page)),
      ].filter((p) => p >= 1 && p <= QURAN_PAGE_COUNT);
      if (fromHistory.length > 0) {
        storage.setItem(
          STORAGE_KEYS.visitedPages,
          JSON.stringify(fromHistory.sort((a, b) => a - b)),
        );
      }
      return fromHistory.sort((a, b) => a - b);
    },

    markPageVisited(page: number): void {
      if (!Number.isInteger(page) || page < 1 || page > QURAN_PAGE_COUNT) {
        return;
      }
      const pages = this.getVisitedPages();
      if (pages.includes(page)) return;
      const next = [...pages, page].sort((a, b) => a - b);
      storage.setItem(STORAGE_KEYS.visitedPages, JSON.stringify(next));
    },

    clear(): void {
      storage.removeItem(STORAGE_KEYS.readingPosition);
      storage.removeItem(STORAGE_KEYS.readingHistory);
      storage.removeItem(STORAGE_KEYS.visitedPages);
    },
  };
}

export type ProgressService = ReturnType<typeof createProgressService>;
