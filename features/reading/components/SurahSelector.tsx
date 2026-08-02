"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

import type { SurahInfo } from "@/types/quran";

type SurahSelectorProps = {
  surahs: SurahInfo[];
  currentSurahId: number;
  onSelect: (startPage: number) => void;
};

function normalizeSurahQuery(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[آأإٱ]/gu, "ا")
    .replace(/ى/gu, "ي")
    .replace(/ة/gu, "ه")
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/gu, "")
    .replace(/\s+/g, " ");
}

function surahMatches(surah: SurahInfo, raw: string): boolean {
  const q = normalizeSurahQuery(raw);
  if (!q) return true;
  if (/^\d{1,3}$/.test(q)) {
    return String(surah.id).startsWith(q) || surah.id === Number(q);
  }
  const ar = normalizeSurahQuery(surah.nameArabic);
  const en = normalizeSurahQuery(surah.nameEnglish);
  const tr = normalizeSurahQuery(surah.nameTranslation ?? "");
  return (
    ar.includes(q) ||
    en.includes(q) ||
    tr.includes(q) ||
    `${surah.id}`.includes(q)
  );
}

/**
 * Searchable surah jump — type a number (2), English (Baqarah), or Arabic name.
 */
export function SurahSelector({
  surahs,
  currentSurahId,
  onSelect,
}: SurahSelectorProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const current = surahs.find((s) => s.id === currentSurahId) ?? surahs[0];
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const list = surahs.filter((s) => surahMatches(s, query));
    return list.slice(0, 40);
  }, [surahs, query]);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: PointerEvent) {
      const target = event.target as Node | null;
      if (target && rootRef.current?.contains(target)) return;
      setOpen(false);
      setQuery("");
    }
    document.addEventListener("pointerdown", onPointer, true);
    return () => document.removeEventListener("pointerdown", onPointer, true);
  }, [open]);

  function pick(surah: SurahInfo) {
    onSelect(surah.startPage);
    setOpen(false);
    setQuery("");
  }

  function commitTyped() {
    const q = query.trim();
    if (!q) return;
    if (/^\d{1,3}$/.test(q)) {
      const id = Number(q);
      const byId = surahs.find((s) => s.id === id);
      if (byId) {
        pick(byId);
        return;
      }
    }
    const first = filtered[0];
    if (first) pick(first);
  }

  return (
    <div ref={rootRef} className="relative min-w-0 flex-1">
      <label className="sr-only" htmlFor={listId}>
        Surah
      </label>
      <input
        id={listId}
        className="border-border bg-surface text-foreground focus:border-primary/40 h-9 w-full rounded-lg border py-1.5 pr-2.5 pl-2.5 text-xs outline-none sm:text-sm"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        aria-controls={`${listId}-list`}
        placeholder="Surah name or number"
        value={
          open
            ? query
            : current
              ? `${current.id}. ${current.nameArabic}`
              : ""
        }
        title="Type surah name or number"
        dir="auto"
        onFocus={() => {
          setOpen(true);
          setQuery("");
        }}
        onChange={(e) => {
          setOpen(true);
          setQuery(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commitTyped();
          } else if (e.key === "Escape") {
            setOpen(false);
            setQuery("");
            (e.target as HTMLInputElement).blur();
          }
        }}
      />
      {open ? (
        <ul
          id={`${listId}-list`}
          role="listbox"
          className="border-border bg-surface absolute z-40 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border py-1 shadow-lg"
        >
          {filtered.length === 0 ? (
            <li className="text-muted px-3 py-2 text-xs">No surah found</li>
          ) : (
            filtered.map((surah) => (
              <li key={surah.id} role="option" aria-selected={surah.id === currentSurahId}>
                <button
                  type="button"
                  className={[
                    "hover:bg-primary/10 flex w-full items-center justify-between gap-2 px-3 py-2 text-start text-xs sm:text-sm",
                    surah.id === currentSurahId ? "bg-primary/10 text-primary" : "text-foreground",
                  ].join(" ")}
                  onClick={() => pick(surah)}
                >
                  <span className="font-quran" dir="rtl" lang="ar">
                    {surah.id}. {surah.nameArabic}
                  </span>
                  <span className="text-muted shrink-0 text-[10px]">
                    {surah.nameEnglish}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
