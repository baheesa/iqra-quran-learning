"use client";

import { useState } from "react";

import {
  highlightSearchText,
  tokenMatchesArabicForm,
  tokenMatchesSearch,
} from "@/features/reading/lib/highlight";
import { isPunctuationToken } from "@/features/reading/lib/meanings";
import type { MatchItem } from "@/features/reading/lib/quran-search";

type Props = {
  query: string;
  items: MatchItem[];
  mode: "arabic" | "urdu" | "both";
  onBack: () => void;
  onOpen: (item: MatchItem) => void;
  onWordTip: (
    token: string,
    ayahId: string,
    page: number,
    el: HTMLElement,
  ) => void;
};

export function SearchMatchesView({
  query,
  items,
  mode,
  onBack,
  onOpen,
  onWordTip,
}: Props) {
  const [openUrdu, setOpenUrdu] = useState<Set<string>>(() => new Set());

  function toggleUrdu(ayahId: string) {
    setOpenUrdu((prev) => {
      const next = new Set(prev);
      if (next.has(ayahId)) next.delete(ayahId);
      else next.add(ayahId);
      return next;
    });
  }

  return (
    <section className="border-border bg-surface/95 space-y-3 rounded-2xl border p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-primary text-lg">Search matches</h2>
          <p className="text-muted mt-1 text-sm">
            “{query}” · {items.length} ayah{items.length === 1 ? "" : "s"}
            {mode === "urdu"
              ? " · Urdu"
              : mode === "both"
                ? " · Arabic + Urdu"
                : " · Arabic"}
            {" · tap Arabic for tips · translation icon for Urdu"}
          </p>
        </div>
        <button
          type="button"
          className="border-border hover:bg-primary/10 rounded-xl border px-3 py-2 text-sm"
          onClick={onBack}
        >
          Back
        </button>
      </div>

      {items.length === 0 ? (
        <p className="text-muted py-8 text-center text-sm">No matches.</p>
      ) : (
        items.map((m) => {
          const urduOpen = openUrdu.has(m.ayahId);
          return (
            <article
              key={m.ayahId}
              className="border-border bg-surface space-y-2 rounded-xl border p-3"
            >
              <div className="text-muted flex justify-between text-xs">
                <span>{formatAyahRef(m.ayahId)}</span>
                <span>p.{m.page}</span>
              </div>
              <div
                className="font-quran text-primary text-right text-xl leading-loose"
                dir="rtl"
              >
                {m.arabic.split(/(\s+)/u).map((tok, i) => {
                  if (!tok.trim()) return <span key={`s-${i}`}>{tok}</span>;
                  if (isPunctuationToken(tok)) {
                    return <span key={`p-${i}`}>{tok}</span>;
                  }
                  const marked =
                    tokenMatchesArabicForm(
                      tok,
                      m.matchedForms?.length
                        ? m.matchedForms
                        : m.matchedArabic,
                    ) || tokenMatchesSearch(tok, query);
                  return (
                    <button
                      key={`w-${i}-${tok}`}
                      type="button"
                      data-tappable-ar="true"
                      className={[
                        "font-quran inline rounded px-0.5",
                        marked
                          ? "bg-amber-300/50 dark:bg-amber-500/30"
                          : "hover:bg-primary/10",
                      ].join(" ")}
                      onClick={(e) => {
                        e.stopPropagation();
                        onWordTip(tok, m.ayahId, m.page, e.currentTarget);
                      }}
                    >
                      {tok}
                    </button>
                  );
                })}
              </div>
              {urduOpen && m.urdu ? (
                <p
                  className="font-urdu text-foreground text-right text-base leading-[2.1]"
                  dir="rtl"
                >
                  {highlightSearchText(m.urdu, query).map((part, i) =>
                    part.hit ? (
                      <mark
                        key={i}
                        className="bg-amber-300/50 rounded px-0.5 dark:bg-amber-500/30"
                      >
                        {part.text}
                      </mark>
                    ) : (
                      <span key={i}>{part.text}</span>
                    ),
                  )}
                </p>
              ) : null}
              <div className="flex items-center justify-end gap-2">
                {m.urdu ? (
                  <button
                    type="button"
                    className={[
                      "border-border text-primary inline-grid h-9 w-9 place-items-center rounded-xl border",
                      urduOpen
                        ? "bg-primary/15 border-primary"
                        : "bg-surface hover:bg-primary/10",
                    ].join(" ")}
                    title={urduOpen ? "Hide Urdu" : "Show Urdu"}
                    aria-label={urduOpen ? "Hide Urdu" : "Show Urdu"}
                    aria-pressed={urduOpen}
                    onClick={() => toggleUrdu(m.ayahId)}
                  >
                    <TranslateGlyph active={urduOpen} />
                  </button>
                ) : null}
                <button
                  type="button"
                  className="bg-primary text-surface inline-grid h-9 w-9 place-items-center rounded-xl"
                  title="Open in Quran"
                  aria-label="Open in Quran"
                  onClick={() => onOpen(m)}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden
                  >
                    <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
                  </svg>
                </button>
              </div>
            </article>
          );
        })
      )}
    </section>
  );
}

function formatAyahRef(ayahId: string): string {
  const [s, a] = ayahId.split(":");
  if (!s || !a) return ayahId;
  return `Surah ${s} · ayah ${a}`;
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
