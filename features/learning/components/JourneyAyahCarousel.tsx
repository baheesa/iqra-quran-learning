"use client";

import { useEffect, useState } from "react";

import journeyAyahs from "@/data/curriculum/journey-ayahs.json";
import { MushafOpenButton } from "@/features/reading/components/MushafOpenButton";

type JourneyAyah = {
  id: string;
  surahId: number;
  ayahNumber: number;
  arabic: string;
  urdu: string;
  page: number | null;
  surahNameEnglish?: string;
};

const AYAHIS = (journeyAyahs.ayahs as JourneyAyah[]).filter(
  (a) => a.arabic && a.urdu,
);

function Chevron({ dir }: { dir: "prev" | "next" }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.1"
      aria-hidden
    >
      {dir === "prev" ? (
        <path d="M15 6l-6 6 6 6" />
      ) : (
        <path d="M9 6l6 6-6 6" />
      )}
    </svg>
  );
}

/** Carousel of authentic Quran ayahs + Urdu (Jalandhry) — no invented quotes. */
export function JourneyAyahCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || AYAHIS.length === 0) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % AYAHIS.length);
    }, 9000);
    return () => window.clearInterval(id);
  }, [paused]);

  if (AYAHIS.length === 0) return null;

  const ayah = AYAHIS[index]!;

  function go(delta: number) {
    setIndex((i) => (i + delta + AYAHIS.length) % AYAHIS.length);
  }

  return (
    <section
      className="border-primary/20 from-primary/[0.07] relative overflow-hidden rounded-xl border bg-gradient-to-br via-surface/95 to-surface"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Motivating ayahs from the Quran"
    >
      <div className="flex items-center justify-between gap-2 border-b border-border/50 px-3.5 py-2.5 sm:px-4">
        <p className="text-muted text-[10px] font-medium tracking-[0.12em] uppercase">
          From the Quran
        </p>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            className="text-muted hover:text-primary inline-flex h-8 w-8 items-center justify-center rounded-lg"
            onClick={() => go(-1)}
            aria-label="Previous ayah"
          >
            <Chevron dir="prev" />
          </button>
          <button
            type="button"
            className="text-muted hover:text-primary inline-flex h-8 w-8 items-center justify-center rounded-lg"
            onClick={() => go(1)}
            aria-label="Next ayah"
          >
            <Chevron dir="next" />
          </button>
        </div>
      </div>

      <div
        key={ayah.id}
        className="animate-rise space-y-3 px-3.5 py-4 sm:px-4"
        aria-live="polite"
      >
        <p className="text-muted text-[11px]">
          {ayah.surahNameEnglish ?? `Surah ${ayah.surahId}`} · {ayah.id}
          {ayah.page ? ` · p.${ayah.page}` : ""}
        </p>
        <p
          className="font-quran text-primary text-xl leading-[2.1] sm:text-2xl"
          dir="rtl"
          lang="ar"
        >
          {ayah.arabic}
        </p>
        <p
          className="font-urdu text-foreground/90 text-base leading-relaxed sm:text-lg"
          dir="rtl"
          lang="ur"
        >
          {ayah.urdu}
        </p>
        {ayah.page ? (
          <MushafOpenButton page={ayah.page} title="Open in mushaf" />
        ) : null}
      </div>

      <div className="text-muted flex items-center justify-between gap-2 px-3.5 pb-3 text-[11px] tabular-nums sm:px-4">
        <span>
          {index + 1} / {AYAHIS.length}
        </span>
        <div
          className="flex max-w-[70%] flex-wrap items-center justify-end gap-1"
          role="tablist"
          aria-label="Ayah slides"
        >
          {AYAHIS.map((item, i) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Ayah ${item.id}`}
              title={item.id}
              onClick={() => setIndex(i)}
              className={
                i === index
                  ? "bg-primary h-1.5 w-3 rounded-full transition-all"
                  : "bg-border/80 hover:bg-primary/40 h-1.5 w-1.5 rounded-full transition-all"
              }
            />
          ))}
        </div>
      </div>
    </section>
  );
}
