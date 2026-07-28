"use client";

import { BookmarkButton } from "@/features/reading/components/BookmarkButton";
import { JuzSelector } from "@/features/reading/components/JuzSelector";
import { PageNavigation } from "@/features/reading/components/PageNavigation";
import { SurahSelector } from "@/features/reading/components/SurahSelector";
import type { JuzInfo, SurahInfo } from "@/types/quran";

export type QuranFontScale = 0 | 1 | 2;

type ReadingToolbarProps = {
  surahs: SurahInfo[];
  juzIndex: JuzInfo[];
  currentJuz: number;
  currentSurahId: number;
  page: number;
  isLoading?: boolean;
  isBookmarked: boolean;
  fontScale: QuranFontScale;
  searchOpen?: boolean;
  onSelectPage: (page: number) => void;
  onPrevious: () => void;
  onNext: () => void;
  onToggleBookmark: () => void;
  onFontScaleChange: (scale: QuranFontScale) => void;
  onToggleSearch?: () => void;
};

export function ReadingToolbar({
  surahs,
  juzIndex,
  currentJuz,
  currentSurahId,
  page,
  isLoading = false,
  isBookmarked,
  fontScale,
  searchOpen = false,
  onSelectPage,
  onPrevious,
  onNext,
  onToggleBookmark,
  onFontScaleChange,
  onToggleSearch,
}: ReadingToolbarProps) {
  return (
    <div className="border-border/70 bg-surface/90 space-y-2 rounded-xl border px-2.5 py-2 shadow-sm backdrop-blur-sm sm:px-3">
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        <PageNavigation
          page={page}
          isLoading={isLoading}
          onPrevious={onPrevious}
          onNext={onNext}
          onSelectPage={onSelectPage}
        />
        <span className="bg-border mx-0.5 hidden h-5 w-px sm:block" aria-hidden />
        <JuzSelector
          juzIndex={juzIndex}
          currentJuz={currentJuz}
          onSelect={onSelectPage}
        />
        <SurahSelector
          surahs={surahs}
          currentSurahId={currentSurahId}
          onSelect={onSelectPage}
        />
        <div
          className="border-border bg-surface inline-flex h-9 items-center overflow-hidden rounded-lg border"
          role="group"
          aria-label="Quran text size"
        >
          <button
            type="button"
            className="text-muted hover:text-primary h-full px-2 text-xs disabled:opacity-35"
            disabled={fontScale <= 0}
            onClick={() => onFontScaleChange((fontScale - 1) as QuranFontScale)}
            title="Smaller text"
            aria-label="Smaller Quran text"
          >
            A−
          </button>
          <span className="bg-border h-4 w-px" aria-hidden />
          <button
            type="button"
            className="text-muted hover:text-primary h-full px-2 text-sm font-medium disabled:opacity-35"
            disabled={fontScale >= 2}
            onClick={() => onFontScaleChange((fontScale + 1) as QuranFontScale)}
            title="Larger text"
            aria-label="Larger Quran text"
          >
            A+
          </button>
        </div>
        <BookmarkButton isBookmarked={isBookmarked} onToggle={onToggleBookmark} />
        {onToggleSearch ? (
          <button
            type="button"
            className={[
              "border-border inline-grid h-9 w-9 place-items-center rounded-lg border",
              searchOpen
                ? "bg-primary/15 border-primary text-primary"
                : "bg-surface text-primary hover:bg-primary/10",
            ].join(" ")}
            title="Search Quran"
            aria-label="Search Quran"
            aria-pressed={searchOpen}
            onClick={onToggleSearch}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2" />
              <path
                d="M16.2 16.2 20 20"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        ) : null}
      </div>
    </div>
  );
}
