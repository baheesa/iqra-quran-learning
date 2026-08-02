"use client";

import type { ReactNode } from "react";

import { normalizeArabic } from "@/features/teacher/domain/arabic";

const LEARNED_WORDS_KEY = "quran.learning.learnedWordIds";
const LEARNED_AYAHS_KEY = "quran.learning.learnedAyahIds";
const LAST_WORDS_UNIT_KEY = "quran.learning.lastWordsUnit";
const LAST_AYAHS_UNIT_KEY = "quran.learning.lastAyahsUnit";

function loadSet(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function saveSet(key: string, ids: Set<string>) {
  localStorage.setItem(key, JSON.stringify([...ids]));
}

export function loadLearnedWordIds(): Set<string> {
  return loadSet(LEARNED_WORDS_KEY);
}

export function saveLearnedWordIds(ids: Set<string>) {
  saveSet(LEARNED_WORDS_KEY, ids);
}

export function loadLearnedAyahIds(): Set<string> {
  return loadSet(LEARNED_AYAHS_KEY);
}

export function saveLearnedAyahIds(ids: Set<string>) {
  saveSet(LEARNED_AYAHS_KEY, ids);
}

const MEMORIZED_DUAS_KEY = "quran.learning.memorizedQuranicDuaIds";

export function loadMemorizedDuaIds(): Set<string> {
  return loadSet(MEMORIZED_DUAS_KEY);
}

export function saveMemorizedDuaIds(ids: Set<string>) {
  saveSet(MEMORIZED_DUAS_KEY, ids);
}

export function loadLastWordsUnit(): number | "all" | null {
  try {
    const raw = localStorage.getItem(LAST_WORDS_UNIT_KEY);
    if (raw === null) return null;
    if (raw === "all") return "all";
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export function saveLastWordsUnit(unit: number | "all") {
  localStorage.setItem(LAST_WORDS_UNIT_KEY, String(unit));
}

export function loadLastAyahsUnit(): number | "all" | null {
  try {
    const raw = localStorage.getItem(LAST_AYAHS_UNIT_KEY);
    if (raw === null) return null;
    if (raw === "all") return "all";
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export function saveLastAyahsUnit(unit: number | "all") {
  localStorage.setItem(LAST_AYAHS_UNIT_KEY, String(unit));
}

const LAST_RULES_UNIT_KEY = "quran.learning.lastRulesUnit";
const FOCUS_UNIT_KEY = "quran.learning.focusUnit";

export function loadLastRulesUnit(): number | "all" | null {
  try {
    const raw = localStorage.getItem(LAST_RULES_UNIT_KEY);
    if (raw === null) return null;
    if (raw === "all") return "all";
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export function saveLastRulesUnit(unit: number | "all") {
  localStorage.setItem(LAST_RULES_UNIT_KEY, String(unit));
}

export function loadFocusUnit(): number | "all" | null {
  try {
    const raw = localStorage.getItem(FOCUS_UNIT_KEY);
    if (raw === null) return null;
    if (raw === "all") return "all";
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export function saveFocusUnit(unit: number | "all") {
  localStorage.setItem(FOCUS_UNIT_KEY, String(unit));
  saveLastWordsUnit(unit);
  saveLastAyahsUnit(unit);
  saveLastRulesUnit(unit);
}

/** Build a Set of normalized Arabic forms the learner has marked. */
export function learnedArabicFormsFromIds(
  learnedIds: Set<string>,
  formById: Record<string, string>,
): Set<string> {
  const forms = new Set<string>();
  for (const id of learnedIds) {
    const arabic = formById[id];
    if (!arabic) continue;
    const key = normalizeArabic(arabic);
    if (key) forms.add(key);
  }
  return forms;
}

export function toUrduDigits(value: number): string {
  return String(value).replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]!);
}

export type ProgressFilter = "all" | "learned" | "remaining";

/** Compact inline SVG icons for filters (no extra deps). */
export const FilterIcons = {
  all: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  learned: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),
  remaining: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  ),
  word: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 19V5" />
      <path d="M4 7h8a3 3 0 010 6H4" />
      <path d="M14 19l3.5-14H20" />
    </svg>
  ),
  phrase: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  ),
  next: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 5.5v13l10-6.5L4 5.5z" />
      <path d="M20 5.5v13" />
    </svg>
  ),
  search: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  ),
  book: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </svg>
  ),
};

export function FilterChip(props: {
  active: boolean;
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={props.title ?? props.label}
      onClick={props.onClick}
      className={
        props.active
          ? "bg-primary text-on-primary inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium sm:text-sm"
          : "border-border text-muted hover:border-primary/40 hover:text-foreground inline-flex shrink-0 items-center gap-1.5 rounded-lg border bg-surface/60 px-2.5 py-1.5 text-xs transition-colors sm:text-sm"
      }
    >
      {props.icon ? (
        <span className="opacity-90" aria-hidden>
          {props.icon}
        </span>
      ) : null}
      <span>{props.label}</span>
    </button>
  );
}

/** Icon-only learned toggle — card background carries the state. */
export function LearnedToggle(props: {
  learned: boolean;
  onToggle: () => void;
  markLabel: string;
  learnedLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={props.onToggle}
      title={props.learned ? props.learnedLabel : props.markLabel}
      aria-label={props.learned ? props.learnedLabel : props.markLabel}
      aria-pressed={props.learned}
      className={
        props.learned
          ? "bg-primary text-on-primary inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm transition-colors"
          : "border-border text-muted hover:border-primary/40 hover:text-primary inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-surface/70 transition-colors"
      }
    >
      {FilterIcons.learned}
    </button>
  );
}

export function learnedCardClass(learned: boolean): string {
  return learned
    ? "border-primary/25 bg-primary/[0.08] rounded-xl border px-3 py-2.5 sm:px-3.5 sm:py-3"
    : "border-border/80 bg-surface/50 rounded-xl border px-3 py-2.5 sm:px-3.5 sm:py-3";
}

/** Compact “jump to next unlearned” control — icon + count only. */
export function NextRemainingButton(props: {
  remainingCount: number;
  onClick: () => void;
  label: string;
  disabled?: boolean;
}) {
  const empty = props.remainingCount <= 0;
  return (
    <button
      type="button"
      onClick={props.onClick}
      disabled={props.disabled || empty}
      title={props.label}
      aria-label={`${props.label}${empty ? "" : `, ${props.remainingCount}`}`}
      className="bg-primary text-on-primary hover:bg-primary/90 inline-flex h-8 shrink-0 items-center gap-1 rounded-lg px-2 text-xs font-medium shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40"
    >
      <span className="rtl:rotate-180" aria-hidden>
        {FilterIcons.next}
      </span>
      {!empty ? (
        <span className="min-w-[1.1rem] text-center tabular-nums">
          {props.remainingCount}
        </span>
      ) : null}
    </button>
  );
}

export function FilterSearch(props: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="border-border bg-background/80 focus-within:border-primary/50 relative flex min-w-0 flex-1 items-center rounded-lg border px-2.5 py-1.5">
      <span className="text-muted me-1.5 shrink-0" aria-hidden>
        {FilterIcons.search}
      </span>
      <input
        type="search"
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
        placeholder={props.placeholder}
        className="text-foreground placeholder:text-muted min-w-0 flex-1 bg-transparent text-xs outline-none sm:text-sm"
        dir="auto"
        enterKeyHint="search"
      />
      {props.value ? (
        <button
          type="button"
          className="text-muted hover:text-foreground ms-1 shrink-0 text-xs"
          onClick={() => props.onChange("")}
          aria-label="Clear search"
        >
          ✕
        </button>
      ) : null}
    </label>
  );
}

export function FilterToolbar(props: {
  stats: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
  search?: ReactNode;
}) {
  return (
    <div className="border-border/80 bg-surface/90 sticky top-2 z-10 space-y-2 rounded-xl border px-3 py-2.5 shadow-sm backdrop-blur-md sm:px-4 sm:py-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-muted flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] sm:text-xs">
          {props.stats}
        </div>
        {props.actions ? (
          <div className="flex shrink-0 items-center gap-1.5">{props.actions}</div>
        ) : null}
      </div>
      {props.search ? <div className="flex gap-2">{props.search}</div> : null}
      <div className="space-y-2">{props.children}</div>
    </div>
  );
}

export function FilterRow(props: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-2 sm:items-center">
      <span className="text-muted w-14 shrink-0 pt-1.5 text-[10px] font-medium tracking-wide uppercase sm:w-16 sm:text-xs">
        {props.label}
      </span>
      <div className="scrollbar-none -mx-1 flex min-w-0 flex-1 gap-1.5 overflow-x-auto px-1 pb-0.5">
        {props.children}
      </div>
    </div>
  );
}
