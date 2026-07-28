"use client";

import { QURAN_JUZ_COUNT } from "@/features/reading/constants";
import type { JuzInfo } from "@/types/quran";

type JuzSelectorProps = {
  juzIndex: JuzInfo[];
  currentJuz: number;
  onSelect: (startPage: number) => void;
};

export function JuzSelector({
  juzIndex,
  currentJuz,
  onSelect,
}: JuzSelectorProps) {
  return (
    <label className="relative inline-flex min-w-0 items-center">
      <span className="sr-only">Juz</span>
      <select
        className="border-border bg-surface text-foreground focus:border-primary/40 h-9 max-w-[7.5rem] appearance-none rounded-lg border py-1.5 pr-7 pl-2.5 text-xs outline-none sm:text-sm"
        value={currentJuz}
        title="Parah / Juz"
        onChange={(event) => {
          const juz = Number(event.target.value);
          const match = juzIndex.find((item) => item.juz === juz);
          if (match) onSelect(match.startPage);
        }}
      >
        {Array.from({ length: QURAN_JUZ_COUNT }, (_, index) => {
          const juz = index + 1;
          return (
            <option key={juz} value={juz}>
              Juz {juz}
            </option>
          );
        })}
      </select>
      <span
        className="text-muted pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-[10px]"
        aria-hidden
      >
        ▾
      </span>
    </label>
  );
}
