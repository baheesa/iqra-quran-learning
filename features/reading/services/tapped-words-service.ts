import { STORAGE_KEYS } from "@/features/reading/constants";
import type { StorageAdapter } from "@/lib/storage/adapter";
import { normalizeArabic } from "@/features/teacher/domain/arabic";

export type TappedWordRecord = {
  id: string;
  arabic: string;
  meaning: string | null;
  tapCount: number;
  firstTappedAt: string;
  lastTappedAt: string;
  lastSurahId: number | null;
  lastAyahNumber: number | null;
  lastPage: number | null;
};

function parseList(value: string | null): TappedWordRecord[] {
  if (!value) return [];
  try {
    return JSON.parse(value) as TappedWordRecord[];
  } catch {
    return [];
  }
}

export function createTappedWordsService(storage: StorageAdapter) {
  return {
    list(): TappedWordRecord[] {
      return parseList(storage.getItem(STORAGE_KEYS.tappedWords)).sort((a, b) =>
        b.lastTappedAt.localeCompare(a.lastTappedAt),
      );
    },

    record(input: {
      arabic: string;
      meaning: string | null;
      surahId?: number | null;
      ayahNumber?: number | null;
      page?: number | null;
    }): TappedWordRecord {
      const key = normalizeArabic(input.arabic) || input.arabic;
      const now = new Date().toISOString();
      const existing = this.list();
      const found = existing.find((item) => item.id === key);

      const next: TappedWordRecord = found
        ? {
            ...found,
            arabic: input.arabic,
            meaning: input.meaning ?? found.meaning,
            tapCount: found.tapCount + 1,
            lastTappedAt: now,
            lastSurahId: input.surahId ?? found.lastSurahId,
            lastAyahNumber: input.ayahNumber ?? found.lastAyahNumber,
            lastPage: input.page ?? found.lastPage,
          }
        : {
            id: key,
            arabic: input.arabic,
            meaning: input.meaning,
            tapCount: 1,
            firstTappedAt: now,
            lastTappedAt: now,
            lastSurahId: input.surahId ?? null,
            lastAyahNumber: input.ayahNumber ?? null,
            lastPage: input.page ?? null,
          };

      const rest = existing.filter((item) => item.id !== key);
      storage.setItem(
        STORAGE_KEYS.tappedWords,
        JSON.stringify([next, ...rest]),
      );
      return next;
    },

    remove(id: string): void {
      const next = this.list().filter((item) => item.id !== id);
      storage.setItem(STORAGE_KEYS.tappedWords, JSON.stringify(next));
    },

    clear(): void {
      storage.removeItem(STORAGE_KEYS.tappedWords);
    },
  };
}

export type TappedWordsService = ReturnType<typeof createTappedWordsService>;
