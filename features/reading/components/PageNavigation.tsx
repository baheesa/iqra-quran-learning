"use client";

import { useEffect, useState } from "react";

import { QURAN_PAGE_COUNT } from "@/features/reading/constants";

type PageNavigationProps = {
  page: number;
  isLoading?: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSelectPage: (page: number) => void;
  compact?: boolean;
};

function Chevron({ dir }: { dir: "prev" | "next" }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
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

function clampPage(value: number): number {
  return Math.min(QURAN_PAGE_COUNT, Math.max(1, Math.round(value)));
}

export function PageNavigation({
  page,
  isLoading = false,
  onPrevious,
  onNext,
  onSelectPage,
  compact = true,
}: PageNavigationProps) {
  const [draft, setDraft] = useState(String(page));

  useEffect(() => {
    setDraft(String(page));
  }, [page]);

  function goToDraft() {
    const parsed = Number.parseInt(draft.trim(), 10);
    if (!Number.isFinite(parsed)) {
      setDraft(String(page));
      return;
    }
    const next = clampPage(parsed);
    setDraft(String(next));
    if (next !== page) {
      onSelectPage(next);
    }
  }

  const btn =
    "border-border bg-surface text-foreground hover:border-primary/35 hover:text-primary inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors disabled:opacity-35";

  return (
    <nav
      className={
        compact
          ? "flex items-center gap-1.5"
          : "flex items-center justify-between gap-3"
      }
      aria-label="Page navigation"
    >
      <button
        type="button"
        className={btn}
        onClick={onPrevious}
        disabled={isLoading || page <= 1}
        aria-label="Previous page"
        title="Previous page"
      >
        <Chevron dir="prev" />
      </button>
      <label className="text-muted flex items-center gap-1 text-xs tabular-nums sm:text-sm">
        <span className="sr-only">Go to page</span>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={draft}
          disabled={isLoading}
          onChange={(event) => setDraft(event.target.value.replace(/[^\d]/g, ""))}
          onBlur={goToDraft}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              goToDraft();
              (event.target as HTMLInputElement).blur();
            }
            if (event.key === "Escape") {
              setDraft(String(page));
              (event.target as HTMLInputElement).blur();
            }
          }}
          className="border-border bg-background text-foreground focus:border-primary h-9 w-11 rounded-lg border text-center text-sm font-medium tabular-nums outline-none transition-colors focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
          aria-label={`Page number, 1 to ${QURAN_PAGE_COUNT}`}
          title="Type a page and press Enter"
        />
        <span className="text-border" aria-hidden>
          /
        </span>
        <span aria-hidden>{QURAN_PAGE_COUNT}</span>
      </label>
      <button
        type="button"
        className={btn}
        onClick={onNext}
        disabled={isLoading || page >= QURAN_PAGE_COUNT}
        aria-label="Next page"
        title="Next page"
      >
        <Chevron dir="next" />
      </button>
    </nav>
  );
}
