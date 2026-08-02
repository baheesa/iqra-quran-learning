"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { HighlightedText } from "@/features/reading/components/HighlightedText";
import { WordMeaningTooltip } from "@/features/reading/components/WordMeaningTooltip";
import { tokenMatchesSearch } from "@/features/reading/lib/highlight";
import { isPunctuationToken } from "@/features/reading/lib/meanings";
import {
  findHitForArabicToken,
  type SearchHit,
} from "@/features/reading/lib/quran-search";

type TipState = {
  wordId: string;
  arabic: string;
  anchor: HTMLElement;
  standalone: boolean;
};

type Props = {
  arabic: string;
  /** Quran ref like "12:6" or "1:5-7" — improves WBW lookup. */
  ayahRef?: string | null;
  /** Active list search query (keeps highlight while tappable). */
  query?: string;
  className?: string;
  /** Shown when the token cannot be mapped to a mushaf word id. */
  fallbackMeaning?: string | null;
};

let cachedIndex: Record<string, SearchHit[]> | null = null;
let indexPromise: Promise<Record<string, SearchHit[]>> | null = null;

async function loadSearchIndex(): Promise<Record<string, SearchHit[]>> {
  if (cachedIndex) return cachedIndex;
  if (!indexPromise) {
    indexPromise = fetch("/api/v1/quran/search-index")
      .then((r) => r.json())
      .then((payload: { data?: { forms?: Record<string, SearchHit[]> } }) => {
        cachedIndex = payload.data?.forms ?? {};
        return cachedIndex;
      })
      .catch(() => {
        cachedIndex = {};
        return cachedIndex;
      });
  }
  return indexPromise;
}

/**
 * Split Arabic into tappable tokens; show mushaf Urdu tip when possible.
 */
export function TappableArabicText({
  arabic,
  ayahRef = null,
  query = "",
  className,
  fallbackMeaning = null,
}: Props) {
  const [index, setIndex] = useState<Record<string, SearchHit[]>>(
    () => cachedIndex ?? {},
  );
  const [tip, setTip] = useState<TipState | null>(null);
  const [fallbackTip, setFallbackTip] = useState<{
    text: string;
    anchor: HTMLElement;
  } | null>(null);

  useEffect(() => {
    void loadSearchIndex().then(setIndex);
  }, []);

  useEffect(() => {
    if (!tip && !fallbackTip) return;
    function onPointer(event: Event) {
      const target = event.target as HTMLElement | null;
      if (target?.closest?.("[role='tooltip']")) return;
      if (tip && target === tip.anchor) return;
      if (fallbackTip && target === fallbackTip.anchor) return;
      setTip(null);
      setFallbackTip(null);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setTip(null);
        setFallbackTip(null);
      }
    }
    document.addEventListener("pointerdown", onPointer, true);
    document.addEventListener("touchstart", onPointer, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer, true);
      document.removeEventListener("touchstart", onPointer, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [tip, fallbackTip]);

  async function onTokenClick(token: string, el: HTMLElement) {
    if (isPunctuationToken(token)) return;
    const idx = Object.keys(index).length ? index : await loadSearchIndex();
    if (idx !== index) setIndex(idx);
    const hit = findHitForArabicToken(token, ayahRef, idx);
    const scoped = Boolean(ayahRef?.trim());
    if (hit) {
      setFallbackTip(null);
      setTip({
        wordId: hit.w,
        arabic: hit.ar || token,
        anchor: el,
        standalone: !scoped,
      });
      return;
    }
    if (fallbackMeaning?.trim()) {
      setTip(null);
      setFallbackTip({ text: fallbackMeaning.trim(), anchor: el });
    }
  }

  return (
    <>
      {tip ? (
        <WordMeaningTooltip
          wordId={tip.wordId}
          arabic={tip.arabic}
          anchorEl={tip.anchor}
          standalone={tip.standalone}
          onResolved={() => undefined}
        />
      ) : null}
      {fallbackTip ? (
        <FallbackTip text={fallbackTip.text} anchor={fallbackTip.anchor} />
      ) : null}
      <span className={className} dir="rtl" lang="ar">
        {arabic.split(/(\s+)/u).map((tok, i) => {
          if (!tok.trim()) return <span key={`s-${i}`}>{tok}</span>;
          if (isPunctuationToken(tok)) {
            return <span key={`p-${i}`}>{tok}</span>;
          }
          const marked = query.trim()
            ? tokenMatchesSearch(tok, query)
            : false;
          return (
            <button
              key={`w-${i}-${tok}`}
              type="button"
              data-tappable-ar="true"
              className={[
                "font-quran inline rounded px-0.5 text-inherit",
                marked
                  ? "bg-amber-300/50 dark:bg-amber-500/30"
                  : "hover:bg-primary/10",
              ].join(" ")}
              onClick={(e) => {
                e.stopPropagation();
                void onTokenClick(tok, e.currentTarget);
              }}
            >
              {query.trim() ? (
                <HighlightedText text={tok} query={query} />
              ) : (
                tok
              )}
            </button>
          );
        })}
      </span>
    </>
  );
}

function FallbackTip({
  text,
  anchor,
}: {
  text: string;
  anchor: HTMLElement;
}) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    const place = () => {
      const rect = anchor.getBoundingClientRect();
      const tipW = Math.min(288, window.innerWidth - 24);
      const left = Math.min(
        Math.max(12, rect.left + rect.width / 2 - tipW / 2),
        window.innerWidth - tipW - 12,
      );
      const top = Math.max(12, rect.top - 12);
      setPos({ top, left });
    };
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [anchor, text]);

  if (!mounted || !pos) return null;

  return createPortal(
    <div
      role="tooltip"
      className="border-border bg-surface pointer-events-none fixed z-[80] max-w-[min(18rem,80vw)] -translate-y-full rounded-2xl border px-3 py-2 text-center shadow-[0_12px_32px_-12px_rgba(0,0,0,0.4)]"
      style={{ top: pos.top, left: pos.left }}
    >
      <p className="font-urdu text-foreground text-[0.95rem] leading-[2.1]">
        {text}
      </p>
    </div>,
    document.body,
  );
}
