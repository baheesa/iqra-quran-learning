"use client";

import type { MatchItem } from "@/features/reading/lib/quran-search";

type Props = {
  query: string;
  onQueryChange: (value: string) => void;
  suggestions: string[];
  loading: boolean;
  previewItems: MatchItem[];
  previewMode: "arabic" | "urdu" | "both";
  onPickSuggestion: (value: string) => void;
  onOpenMatch: (item: MatchItem) => void;
  onViewAll: () => void;
};

export function QuranSearchPanel({
  query,
  onQueryChange,
  suggestions,
  loading,
  previewItems,
  previewMode,
  onPickSuggestion,
  onOpenMatch,
  onViewAll,
}: Props) {
  const ready =
    query.trim().length >= 2 || query.trim().includes(" ");

  return (
    <div className="border-border bg-surface/95 space-y-2 rounded-xl border p-3">
      <input
        className="border-border bg-surface text-foreground focus:ring-primary/30 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2"
        placeholder="Search Arabic or Urdu…"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        dir="auto"
        autoFocus
      />
      {loading ? <p className="text-muted text-xs">Loading search…</p> : null}
      {suggestions.length > 0 && query.trim().length >= 1 ? (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              className="font-quran border-border hover:border-primary rounded-full border px-3 py-1 text-sm"
              onClick={() => onPickSuggestion(s)}
            >
              {s}
            </button>
          ))}
        </div>
      ) : null}
      {ready ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-muted text-xs">
              {previewItems.length === 0
                ? "No matches"
                : `${previewItems.length} ayah${previewItems.length === 1 ? "" : "s"} · ${
                    previewMode === "urdu"
                      ? "Urdu"
                      : previewMode === "both"
                        ? "Arabic + Urdu"
                        : "Arabic"
                  }`}
            </p>
            {previewItems.length > 0 ? (
              <button
                type="button"
                className="bg-primary text-surface rounded-lg px-3 py-1.5 text-xs font-medium"
                onClick={onViewAll}
              >
                View all
              </button>
            ) : null}
          </div>
          <div className="max-h-56 space-y-1 overflow-y-auto">
            {previewItems.slice(0, 12).map((m) => (
              <button
                key={m.ayahId}
                type="button"
                className="border-border hover:bg-primary/5 flex w-full flex-col gap-0.5 rounded-lg border px-3 py-2 text-start"
                onClick={() => onOpenMatch(m)}
              >
                <span className="font-quran text-primary text-base" dir="rtl">
                  {m.matchedArabic ?? m.arabic.slice(0, 42)}
                  {!m.matchedArabic && m.arabic.length > 42 ? "…" : ""}
                </span>
                <span className="text-muted text-xs">
                  {m.ayahId} · p.{m.page}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-muted text-xs">
          Arabic word/phrase or Urdu meaning (e.g. زمین، رحمن)
        </p>
      )}
    </div>
  );
}
