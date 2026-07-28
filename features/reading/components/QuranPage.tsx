"use client";

import { QuranAyah } from "@/features/reading/components/QuranAyah";
import type { QuranPageData, SelectedWordInfo, SurahInfo } from "@/types/quran";

type QuranPageProps = {
  page: QuranPageData;
  surahs: SurahInfo[];
  selectedWordId: string | null;
  focusedAyahId?: string | null;
  focusedWordId?: string | null;
  openAyahUrduIds?: Set<string>;
  ayahUrduById?: Record<string, string>;
  fontScale?: 0 | 1 | 2;
  isFormLearned: (arabic: string) => boolean;
  onSelectWord: (info: SelectedWordInfo) => void;
  onMeaningResolved: (info: SelectedWordInfo, meaning: string | null) => void;
  onToggleAyahUrdu?: (ayahId: string) => void;
};

const FONT_SCALE_CLASS: Record<0 | 1 | 2, string> = {
  0: "[&_[data-quran-word]]:text-[1.35rem] [&_[data-quran-word]]:leading-[2.25rem] md:[&_[data-quran-word]]:text-[1.55rem] md:[&_[data-quran-word]]:leading-[2.55rem]",
  1: "[&_[data-quran-word]]:text-[1.55rem] [&_[data-quran-word]]:leading-[2.55rem] md:[&_[data-quran-word]]:text-[1.8rem] md:[&_[data-quran-word]]:leading-[2.9rem]",
  2: "[&_[data-quran-word]]:text-[1.85rem] [&_[data-quran-word]]:leading-[3rem] md:[&_[data-quran-word]]:text-[2.15rem] md:[&_[data-quran-word]]:leading-[3.4rem]",
};

export function QuranPageView({
  page,
  surahs,
  selectedWordId,
  focusedAyahId = null,
  focusedWordId = null,
  openAyahUrduIds,
  ayahUrduById = {},
  fontScale = 1,
  isFormLearned,
  onSelectWord,
  onMeaningResolved,
  onToggleAyahUrdu,
}: QuranPageProps) {
  let lastSurahId: number | null = null;

  return (
    <article
      className={`border-border bg-surface/95 overflow-visible rounded-2xl border px-4 py-6 shadow-[0_10px_40px_-24px_rgba(31,77,58,0.35)] md:px-10 md:py-10 ${FONT_SCALE_CLASS[fontScale]}`}
    >
      <header className="border-border text-muted mb-6 flex items-center justify-between gap-3 border-b pb-3 text-sm">
        <span>پارہ {toUrduDigits(page.juz)}</span>
        <span>صفحہ {toUrduDigits(page.page)}</span>
      </header>

      {page.ayahs.map((ayah) => {
        const showSurahHeader = ayah.surahId !== lastSurahId;
        lastSurahId = ayah.surahId;
        const surah = surahs.find((item) => item.id === ayah.surahId);

        return (
          <div key={ayah.id}>
            {showSurahHeader && surah ? (
              <div className="mt-2 mb-5 text-center">
                <h2 className="font-quran text-primary text-2xl md:text-3xl">
                  {surah.nameArabic}
                </h2>
                <p className="text-muted mt-1 text-sm">
                  سورۃ {toUrduDigits(surah.id)} · {surah.revelationType} ·{" "}
                  {toUrduDigits(surah.ayahCount)} آیات
                </p>
              </div>
            ) : null}
            <QuranAyah
              ayah={ayah}
              selectedWordId={selectedWordId}
              focusedWordId={focusedWordId}
              isFocusedAyah={focusedAyahId === ayah.id}
              ayahUrdu={ayahUrduById[ayah.id] ?? null}
              ayahUrduOpen={openAyahUrduIds?.has(ayah.id) ?? false}
              isFormLearned={isFormLearned}
              onSelectWord={onSelectWord}
              onMeaningResolved={onMeaningResolved}
              onToggleAyahUrdu={onToggleAyahUrdu}
            />
          </div>
        );
      })}
    </article>
  );
}

function toUrduDigits(value: number): string {
  return String(value).replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]!);
}
