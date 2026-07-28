"use client";

import { useEffect, useState } from "react";
import { WordMeaningTooltip } from "@/features/reading/components/WordMeaningTooltip";
import { isPunctuationToken } from "@/features/reading/lib/meanings";
import type { QuranWordData, SelectedWordInfo } from "@/types/quran";

type QuranWordProps = {
  word: QuranWordData;
  ayahId: string;
  surahId: number;
  ayahNumber: number;
  page: number;
  juz: number;
  isSelected: boolean;
  isFocused?: boolean;
  isLearned?: boolean;
  prevWord?: QuranWordData | null;
  nextWord?: QuranWordData | null;
  onSelect: (info: SelectedWordInfo) => void;
  onMeaningResolved: (info: SelectedWordInfo, meaning: string | null) => void;
};

export function QuranWord({
  word,
  ayahId,
  surahId,
  ayahNumber,
  page,
  juz,
  isSelected,
  isFocused = false,
  isLearned = false,
  prevWord = null,
  nextWord = null,
  onSelect,
  onMeaningResolved,
}: QuranWordProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!isSelected) setAnchorEl(null);
  }, [isSelected]);

  if (isPunctuationToken(word.arabic)) {
    return (
      <span
        className="font-quran text-foreground inline px-0.5"
        data-word-id={word.id}
      >
        {word.arabic}
      </span>
    );
  }

  function toInfo(): SelectedWordInfo {
    return {
      id: word.id,
      arabic: word.arabic,
      position: word.position,
      surahId,
      ayahNumber,
      page,
      juz,
      ayahId,
    };
  }

  return (
    <span
      className="relative inline-flex flex-col items-center"
      data-word-id={word.id}
    >
      {isSelected && anchorEl ? (
        <WordMeaningTooltip
          wordId={word.id}
          arabic={word.arabic}
          anchorEl={anchorEl}
          prevId={prevWord?.id}
          prevArabic={prevWord?.arabic}
          nextId={nextWord?.id}
          nextArabic={nextWord?.arabic}
          onResolved={(meaning) => onMeaningResolved(toInfo(), meaning)}
        />
      ) : null}
      <button
        type="button"
        data-quran-word="true"
        className={[
          "font-quran inline rounded-md px-0.5 transition-colors",
          isSelected
            ? "bg-primary/15 text-primary ring-primary/30 ring-1"
            : isFocused
              ? "bg-primary/25 text-primary ring-primary/40 ring-2"
              : isLearned
                ? "bg-primary/[0.09] text-primary/90 hover:bg-primary/15"
                : "hover:bg-primary/10 text-foreground",
        ].join(" ")}
        onClick={(event) => {
          event.stopPropagation();
          setAnchorEl(event.currentTarget);
          onSelect(toInfo());
        }}
        aria-label={`لفظ ${word.arabic}`}
        aria-expanded={isSelected}
        title={isLearned ? "Marked as known" : undefined}
      >
        {word.arabic}
      </button>
    </span>
  );
}
