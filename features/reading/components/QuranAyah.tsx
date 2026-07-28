"use client";

import { QuranWord } from "@/features/reading/components/QuranWord";
import { isPunctuationToken } from "@/features/reading/lib/meanings";
import type { QuranAyahData, SelectedWordInfo } from "@/types/quran";

type QuranAyahProps = {
  ayah: QuranAyahData;
  selectedWordId: string | null;
  focusedWordId?: string | null;
  isFocusedAyah?: boolean;
  ayahUrdu?: string | null;
  ayahUrduOpen?: boolean;
  isFormLearned: (arabic: string) => boolean;
  onSelectWord: (info: SelectedWordInfo) => void;
  onMeaningResolved: (info: SelectedWordInfo, meaning: string | null) => void;
  onToggleAyahUrdu?: (ayahId: string) => void;
};

export function QuranAyah({
  ayah,
  selectedWordId,
  focusedWordId = null,
  isFocusedAyah = false,
  ayahUrdu = null,
  ayahUrduOpen = false,
  isFormLearned,
  onSelectWord,
  onMeaningResolved,
  onToggleAyahUrdu,
}: QuranAyahProps) {
  return (
    <div
      className={[
        "mb-4 rounded-xl p-1 text-right transition-colors",
        isFocusedAyah ? "bg-primary/10 ring-primary/25 ring-1" : "",
      ].join(" ")}
      dir="rtl"
      data-ayah-id={ayah.id}
    >
      <div className="flex flex-wrap justify-start gap-x-1 gap-y-2">
        {ayah.words.map((word, wi) => {
          const prev = ayah.words
            .slice(0, wi)
            .reverse()
            .find((x) => !isPunctuationToken(x.arabic));
          const next = ayah.words
            .slice(wi + 1)
            .find((x) => !isPunctuationToken(x.arabic));
          return (
            <QuranWord
              key={word.id}
              word={word}
              ayahId={ayah.id}
              surahId={ayah.surahId}
              ayahNumber={ayah.ayahNumber}
              page={ayah.page}
              juz={ayah.juz}
              isSelected={selectedWordId === word.id}
              isFocused={focusedWordId === word.id}
              isLearned={isFormLearned(word.arabic)}
              prevWord={prev ?? null}
              nextWord={next ?? null}
              onSelect={onSelectWord}
              onMeaningResolved={onMeaningResolved}
            />
          );
        })}
        <span className="font-quran text-primary/70 border-border mx-1 inline-flex h-8 w-8 items-center justify-center rounded-full border text-sm md:h-9 md:w-9">
          {ayah.ayahNumber}
        </span>
      </div>
      {onToggleAyahUrdu ? (
        <div className="mt-1 flex justify-end">
          <button
            type="button"
            className={[
              "border-border text-primary inline-grid h-8 w-8 place-items-center rounded-lg border",
              ayahUrduOpen ? "bg-primary/15 border-primary" : "bg-surface hover:bg-primary/10",
            ].join(" ")}
            title={ayahUrduOpen ? "Hide ayah Urdu" : "Show ayah Urdu"}
            aria-label={ayahUrduOpen ? "Hide ayah Urdu" : "Show ayah Urdu"}
            aria-pressed={ayahUrduOpen}
            onClick={(e) => {
              e.stopPropagation();
              onToggleAyahUrdu(ayah.id);
            }}
          >
            <TranslateGlyph active={ayahUrduOpen} />
          </button>
        </div>
      ) : null}
      {ayahUrduOpen ? (
        <p className="font-urdu border-border bg-surface/80 text-foreground mt-2 rounded-xl border px-3 py-2 text-base leading-[2.1]">
          {ayahUrdu?.trim() || "No connected meaning for this ayah yet."}
        </p>
      ) : null}
    </div>
  );
}

function TranslateGlyph({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden fill="none">
      <rect
        x="3.5"
        y="4.5"
        width="11"
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth={active ? 2 : 1.7}
        fill={active ? "currentColor" : "none"}
        fillOpacity={active ? 0.18 : 0}
      />
      <path
        d="M6.2 8h5.6M6.2 11h3.8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M12.5 12.5h6.5A2 2 0 0 1 21 14.5v5a2 2 0 0 1-2 2h-1.2L14.5 24v-2.5H12.5A2 2 0 0 1 10.5 19.5v-1.2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}
