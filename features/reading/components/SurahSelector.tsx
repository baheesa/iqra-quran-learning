"use client";

import type { SurahInfo } from "@/types/quran";

type SurahSelectorProps = {
  surahs: SurahInfo[];
  currentSurahId: number;
  onSelect: (startPage: number) => void;
};

export function SurahSelector({
  surahs,
  currentSurahId,
  onSelect,
}: SurahSelectorProps) {
  return (
    <label className="relative min-w-0 flex-1">
      <span className="sr-only">Surah</span>
      <select
        className="border-border bg-surface text-foreground focus:border-primary/40 h-9 w-full appearance-none rounded-lg border py-1.5 pr-7 pl-2.5 text-xs outline-none sm:text-sm"
        value={currentSurahId}
        title="Surah"
        dir="rtl"
        onChange={(event) => {
          const surahId = Number(event.target.value);
          const match = surahs.find((surah) => surah.id === surahId);
          if (match) onSelect(match.startPage);
        }}
      >
        {surahs.map((surah) => (
          <option key={surah.id} value={surah.id}>
            {surah.id}. {surah.nameArabic}
          </option>
        ))}
      </select>
      <span
        className="text-muted pointer-events-none absolute top-1/2 left-2 -translate-y-1/2 text-[10px]"
        aria-hidden
      >
        ▾
      </span>
    </label>
  );
}
