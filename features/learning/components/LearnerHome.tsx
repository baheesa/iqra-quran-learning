"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import duasData from "@/data/duas/daily-duas.json";
import {
  loadFocusUnit,
  loadLearnedAyahIds,
  loadLearnedWordIds,
  loadMemorizedDuaIds,
  saveFocusUnit,
  saveLearnedWordIds,
} from "@/features/knowledge/components/curriculum-filters";
import { JourneyAyahCarousel } from "@/features/learning/components/JourneyAyahCarousel";
import type { DashboardSummary } from "@/features/learning/types";
import { QURAN_PAGE_COUNT } from "@/features/reading/constants";
import { createProgressService } from "@/features/reading/services/progress-service";
import { createBrowserLocalStorage } from "@/lib/storage/adapter";

const QURANIC_DUA_IDS = (duasData.duas as Array<{ id: string; category: string }>)
  .filter((d) => d.category === "quranic")
  .map((d) => d.id);
const QURANIC_DUA_TOTAL = QURANIC_DUA_IDS.length;

export type UnitProgressSeed = {
  unit: number;
  wordIds: string[];
  ayahIds: string[];
};

export type PracticeWord = {
  id: string;
  arabic: string;
  meaning: string;
  unit: number;
  number: number;
};

type Props = {
  dashboard: DashboardSummary;
  units: UnitProgressSeed[];
  practiceWords: PracticeWord[];
};

type FocusUnit = number | "all";

const DAILY_STEPS = [
  {
    id: "words",
    label: "Words",
    hint: "Mark unit vocabulary",
    href: "/curriculum",
    icon: "eye",
  },
  {
    id: "read",
    label: "Read",
    hint: "Open the mushaf",
    href: "/quran",
    icon: "book",
  },
  {
    id: "recognize",
    label: "Recognize",
    hint: "Tap familiar forms",
    href: "/curriculum",
    icon: "check",
  },
  {
    id: "rules",
    label: "Qawaid",
    hint: "Today’s lesson pattern",
    href: "/rules",
    icon: "rules",
  },
] as const;

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function hashSeed(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededShuffle<T>(items: T[], seed: number): T[] {
  const next = [...items];
  let s = seed || 1;
  for (let i = next.length - 1; i > 0; i -= 1) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const j = s % (i + 1);
    const a = next[i]!;
    next[i] = next[j]!;
    next[j] = a;
  }
  return next;
}

function ActionIcon({
  name,
  size = 20,
}: {
  name:
    | "book"
    | "rules"
    | "ayahs"
    | "words"
    | "duas"
    | "skip"
    | "know"
    | "flip"
    | "eye"
    | "grid"
    | "play";
  size?: number;
}) {
  const props = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none" as const,
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };
  switch (name) {
    case "book":
      return (
        <svg {...props}>
          <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
        </svg>
      );
    case "rules":
      return (
        <svg {...props}>
          <path d="M4 6h16M4 12h10M4 18h14" />
          <path d="M18 10l2 2-2 2" />
        </svg>
      );
    case "duas":
      return (
        <svg {...props}>
          <path d="M12 3v2" />
          <path d="M7 8c0-2.5 2.2-4.5 5-4.5s5 2 5 4.5c0 2.2-1.5 3.5-3 4.5v2" />
          <path d="M10 18h4" />
          <path d="M9 21h6" />
        </svg>
      );
    case "ayahs":
      return (
        <svg {...props}>
          <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
        </svg>
      );
    case "words":
      return (
        <svg {...props}>
          <path d="M4 7h8a3 3 0 010 6H4" />
          <path d="M4 5v14" />
          <path d="M14 19l3.5-14H20" />
        </svg>
      );
    case "skip":
      return (
        <svg {...props}>
          <path d="M5 5l9 7-9 7V5z" />
          <path d="M19 5v14" />
        </svg>
      );
    case "know":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" />
          <path d="M8.5 12.5l2.5 2.5 4.5-5" />
        </svg>
      );
    case "flip":
      return (
        <svg {...props}>
          <path d="M3 12a9 9 0 0115.5-6.36" />
          <path d="M18.5 3v4.5H14" />
          <path d="M21 12a9 9 0 01-15.5 6.36" />
          <path d="M5.5 21v-4.5H10" />
        </svg>
      );
    case "eye":
      return (
        <svg {...props}>
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case "grid":
      return (
        <svg {...props}>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      );
    case "play":
      return (
        <svg {...props}>
          <path d="M8 5v14l11-7L8 5z" />
        </svg>
      );
    default:
      return null;
  }
}

export function LearnerHome({ dashboard, units, practiceWords }: Props) {
  const [pagesVisited, setPagesVisited] = useState(0);
  const [currentPage, setCurrentPage] = useState(dashboard.currentPage);
  const [learnedWords, setLearnedWords] = useState<Set<string>>(new Set());
  const [learnedAyahs, setLearnedAyahs] = useState<Set<string>>(new Set());
  const [checklistDone, setChecklistDone] = useState<Record<string, boolean>>(
    {},
  );
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [recognizedToday, setRecognizedToday] = useState(0);
  const [focusUnit, setFocusUnit] = useState<FocusUnit>("all");
  const [memorizedDuas, setMemorizedDuas] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const progress = createProgressService(createBrowserLocalStorage());
      setPagesVisited(progress.getVisitedPages().length);
      const pos = progress.getPosition();
      if (pos?.page) setCurrentPage(pos.page);
      setLearnedWords(loadLearnedWordIds());
      setLearnedAyahs(loadLearnedAyahIds());
      const duaIds = loadMemorizedDuaIds();
      setMemorizedDuas(
        QURANIC_DUA_IDS.reduce((n, id) => n + (duaIds.has(id) ? 1 : 0), 0),
      );

      const savedFocus = loadFocusUnit();
      if (savedFocus !== null) {
        if (savedFocus === "all") setFocusUnit("all");
        else if (units.some((u) => Number(u.unit) === Number(savedFocus))) {
          setFocusUnit(savedFocus);
        }
      }

      const today = todayKey();
      const raw = localStorage.getItem("quran.learning.dailyChecklist");
      if (raw) {
        const parsed = JSON.parse(raw) as {
          day?: string;
          done?: Record<string, boolean>;
        };
        if (parsed.day === today && parsed.done) setChecklistDone(parsed.done);
      }
      const recRaw = localStorage.getItem("quran.learning.recognizedToday");
      if (recRaw) {
        const parsed = JSON.parse(recRaw) as { day?: string; count?: number };
        if (parsed.day === today && typeof parsed.count === "number") {
          setRecognizedToday(parsed.count);
        }
      }
    } catch {
      // ignore
    }
    setReady(true);
  }, [units]);

  function selectFocus(unit: FocusUnit) {
    setFocusUnit(unit);
    setCardIndex(0);
    setFlipped(false);
    try {
      saveFocusUnit(unit);
    } catch {
      // ignore
    }
  }

  const scopedUnits = useMemo(() => {
    if (focusUnit === "all") return units;
    return units.filter((u) => Number(u.unit) === Number(focusUnit));
  }, [units, focusUnit]);

  const day = todayKey();

  const deck = useMemo(() => {
    const pool = practiceWords.filter((w) => {
      if (learnedWords.has(w.id)) return false;
      if (focusUnit !== "all" && Number(w.unit) !== Number(focusUnit)) {
        return false;
      }
      return Boolean(w.meaning);
    });
    const seed = hashSeed(`${day}:${String(focusUnit)}`);
    return seededShuffle(pool, seed).slice(0, 12);
  }, [practiceWords, learnedWords, focusUnit, day]);

  const card = deck[cardIndex % Math.max(deck.length, 1)];

  useEffect(() => {
    setCardIndex(0);
    setFlipped(false);
  }, [focusUnit, day]);

  function toggleStep(id: string) {
    setChecklistDone((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem(
          "quran.learning.dailyChecklist",
          JSON.stringify({ day: todayKey(), done: next }),
        );
      } catch {
        // ignore
      }
      return next;
    });
  }

  function bumpRecognized() {
    setRecognizedToday((n) => {
      const next = n + 1;
      try {
        localStorage.setItem(
          "quran.learning.recognizedToday",
          JSON.stringify({ day: todayKey(), count: next }),
        );
      } catch {
        // ignore
      }
      return next;
    });
  }

  function markKnown() {
    if (!card) return;
    setLearnedWords((prev) => {
      const next = new Set(prev);
      next.add(card.id);
      saveLearnedWordIds(next);
      return next;
    });
    bumpRecognized();
    setFlipped(false);
    setCardIndex((i) => i + 1);
    if (!checklistDone.recognize) toggleStep("recognize");
  }

  function skipCard() {
    setFlipped(false);
    setCardIndex((i) => i + 1);
  }

  const scopedWordIds = useMemo(
    () => scopedUnits.flatMap((unit) => unit.wordIds),
    [scopedUnits],
  );
  const curriculumKnown = useMemo(() => {
    let n = 0;
    for (const id of scopedWordIds) if (learnedWords.has(id)) n += 1;
    return n;
  }, [scopedWordIds, learnedWords]);
  const curriculumWordTotal = scopedWordIds.length || 1;

  const nextWord = useMemo(() => {
    for (const word of practiceWords) {
      if (focusUnit !== "all" && Number(word.unit) !== Number(focusUnit)) {
        continue;
      }
      if (!learnedWords.has(word.id)) {
        return word;
      }
    }
    return null;
  }, [practiceWords, learnedWords, focusUnit]);

  const readingPct = (pagesVisited / QURAN_PAGE_COUNT) * 100;
  const vocabPct = (curriculumKnown / curriculumWordTotal) * 100;
  const duasPct =
    QURANIC_DUA_TOTAL > 0 ? (memorizedDuas / QURANIC_DUA_TOTAL) * 100 : 0;

  const unitRings = useMemo(() => {
    return units.map((unit) => {
      const wordTotal = unit.wordIds.length || 1;
      const ayahTotal = unit.ayahIds.length || 1;
      let wordsLearned = 0;
      let ayahsLearned = 0;
      for (const id of unit.wordIds) if (learnedWords.has(id)) wordsLearned += 1;
      for (const id of unit.ayahIds) if (learnedAyahs.has(id)) ayahsLearned += 1;
      const wordPct = (wordsLearned / wordTotal) * 100;
      const ayahPct = (ayahsLearned / ayahTotal) * 100;
      return {
        unit: unit.unit,
        combined: (wordPct + ayahPct) / 2,
        wordsLearned,
        wordTotal: unit.wordIds.length,
      };
    });
  }, [units, learnedWords, learnedAyahs]);

  const stepsDone = DAILY_STEPS.filter((s) => checklistDone[s.id]).length;
  const focusLabel =
    focusUnit === "all" ? "All units" : `Unit ${focusUnit}`;

  return (
    <div className="relative space-y-3 pb-4">
      {/* 1. Resume — primary actions */}
      <section className="border-primary/20 from-primary/[0.07] overflow-hidden rounded-xl border bg-gradient-to-br to-surface/95">
        <div className="flex">
          <Link
            href={currentPage ? `/quran?page=${currentPage}` : "/quran"}
            title="Continue reading"
            aria-label={`Continue reading page ${currentPage || 1}`}
            className="hover:bg-primary/[0.06] flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2.5 transition-colors"
          >
            <span className="bg-primary text-on-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
              <ActionIcon name="book" size={15} />
            </span>
            <span className="min-w-0 text-start">
              <span className="text-primary block text-sm font-medium tabular-nums">
                p.{currentPage || 1}
              </span>
              <span className="text-muted text-[10px]">Mushaf</span>
            </span>
          </Link>
          <div className="bg-border/70 w-px self-stretch" aria-hidden />
          {nextWord ? (
            <Link
              href="/curriculum"
              title="Next remaining word"
              aria-label={`Unit ${nextWord.unit} word ${nextWord.number}`}
              onClick={() => {
                if (focusUnit === "all") selectFocus(nextWord.unit);
              }}
              className="hover:bg-primary/[0.06] flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2.5 transition-colors"
            >
              <span
                className="font-quran text-primary bg-primary/10 flex h-8 min-w-8 shrink-0 items-center justify-center rounded-lg px-1 text-sm"
                dir="rtl"
                lang="ar"
              >
                {nextWord.arabic.length > 6
                  ? `${nextWord.arabic.slice(0, 4)}…`
                  : nextWord.arabic}
              </span>
              <span className="min-w-0 text-start">
                <span className="text-primary block text-sm font-medium">
                  U{nextWord.unit} · #{nextWord.number}
                </span>
                <span className="text-muted text-[10px]">Next word</span>
              </span>
            </Link>
          ) : (
            <div className="text-muted flex flex-1 items-center gap-2 px-3 py-2.5 text-xs">
              <ActionIcon name="know" size={14} />
              Words done
            </div>
          )}
        </div>
      </section>

      {/* 2. Navigate */}
      <nav className="flex flex-wrap gap-1.5" aria-label="Main learning links">
        {(
          [
            {
              href: currentPage ? `/quran?page=${currentPage}` : "/quran",
              label: "Quran",
              icon: "book" as const,
              primary: true,
            },
            { href: "/curriculum", label: "Words", icon: "words" as const },
            { href: "/duas", label: "Duas", icon: "duas" as const },
            { href: "/ayahs", label: "Ayahs", icon: "ayahs" as const },
            { href: "/rules", label: "Qawaid", icon: "rules" as const },
            { href: "/help", label: "Manual", icon: "book" as const },
          ] as const
        ).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={
              "primary" in item && item.primary
                ? "bg-primary text-on-primary inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium"
                : "border-border text-primary hover:border-primary/40 inline-flex min-h-9 items-center gap-1.5 rounded-lg border px-2.5 text-xs"
            }
          >
            <ActionIcon name={item.icon} size={14} />
            {item.label}
          </Link>
        ))}
        <a
          href="/downloads/iqra-quran-learning.apk"
          download
          className="border-border text-primary hover:border-primary/40 inline-flex min-h-9 items-center gap-1.5 rounded-lg border px-2.5 text-xs"
        >
          Android APK
        </a>
      </nav>

      {/* 3. Quick recognize */}
      <section className="border-border/50 from-primary/[0.05] overflow-hidden rounded-xl border bg-gradient-to-b to-surface/95">
        <div className="flex items-center justify-between gap-2 px-3 pt-2.5">
          <div className="flex items-center gap-2">
            <h2 className="text-primary text-sm font-medium">Recognize</h2>
            <span className="text-muted text-[10px] tabular-nums">
              {recognizedToday} today
              {ready && focusUnit !== "all" ? ` · U${focusUnit}` : ""}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor="home-focus-unit">
              Focus unit
            </label>
            <select
              id="home-focus-unit"
              value={focusUnit === "all" ? "all" : String(focusUnit)}
              onChange={(e) => {
                const v = e.target.value;
                selectFocus(v === "all" ? "all" : Number(v));
              }}
              className="border-border text-muted bg-background/70 max-w-[5.5rem] rounded-md border px-1.5 py-1 text-[10px] outline-none"
            >
              <option value="all">All units</option>
              {units.map((u) => (
                <option key={u.unit} value={u.unit}>
                  Unit {u.unit}
                </option>
              ))}
            </select>
            <span className="text-muted text-[10px] tabular-nums">
              {deck.length ? `${(cardIndex % deck.length) + 1}/${deck.length}` : "—"}
            </span>
          </div>
        </div>

        {deck.length === 0 || !card ? (
          <div className="flex items-center justify-between gap-2 px-3 py-3">
            <p className="text-muted text-xs">No remaining words here.</p>
            <button
              type="button"
              className="border-border text-primary inline-flex h-8 items-center rounded-md border px-2 text-[11px]"
              onClick={() => selectFocus("all")}
            >
              All units
            </button>
          </div>
        ) : (
          <div className="px-3 pb-3 pt-2">
            <button
              type="button"
              onClick={() => setFlipped((f) => !f)}
              title={flipped ? "Show Arabic" : "Reveal meaning"}
              aria-label={flipped ? "Show Arabic" : "Reveal meaning"}
              className="border-border/60 bg-surface relative mx-auto flex min-h-[5.5rem] w-full max-w-sm flex-col items-center justify-center rounded-xl border px-3 py-3 text-center transition-transform active:scale-[0.99]"
            >
              <span className="text-muted absolute top-2 right-2">
                <ActionIcon name="flip" size={12} />
              </span>
              {!flipped ? (
                <span
                  className="font-quran text-primary text-2xl leading-relaxed"
                  dir="rtl"
                  lang="ar"
                >
                  {card.arabic}
                </span>
              ) : (
                <span
                  className="font-urdu text-foreground text-base leading-relaxed"
                  dir="rtl"
                  lang="ur"
                >
                  {card.meaning}
                </span>
              )}
              <span className="text-muted mt-1 text-[10px]">U{card.unit}</span>
            </button>
            <div className="mx-auto mt-2 flex max-w-sm gap-1.5">
              <button
                type="button"
                onClick={skipCard}
                title="Skip for later"
                aria-label="Skip for later"
                className="border-border text-muted hover:text-foreground inline-flex min-h-10 flex-1 items-center justify-center rounded-lg border"
              >
                <ActionIcon name="skip" size={16} />
              </button>
              <button
                type="button"
                onClick={markKnown}
                title="I know it"
                aria-label="Mark as known"
                className="bg-primary text-on-primary inline-flex min-h-10 flex-1 items-center justify-center rounded-lg"
              >
                <ActionIcon name="know" size={18} />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 4. Progress — compact bars */}
      <section className="border-border/50 bg-surface/90 space-y-2 rounded-xl border px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-primary text-sm font-medium">Progress</h2>
          <span className="text-muted text-[10px]">
            Today {stepsDone}/{DAILY_STEPS.length}
          </span>
        </div>
        <div className="space-y-1.5">
          {(
            [
              focusUnit === "all"
                ? {
                    key: "pages",
                    label: "Pages",
                    sub: `${pagesVisited}/${QURAN_PAGE_COUNT}`,
                    pct: readingPct,
                  }
                : null,
              {
                key: "words",
                label: "Words",
                sub: `${curriculumKnown}/${curriculumWordTotal}`,
                pct: vocabPct,
              },
              {
                key: "duas",
                label: "Duas",
                sub: `${memorizedDuas}/${QURANIC_DUA_TOTAL}`,
                pct: duasPct,
              },
            ] as const
          )
            .filter(Boolean)
            .map((row) => {
              if (!row) return null;
              const pct = Math.round(Math.max(0, Math.min(100, row.pct)));
              return (
                <div key={row.key} className="flex items-center gap-2">
                  <span className="text-muted w-12 shrink-0 text-[10px]">
                    {row.label}
                  </span>
                  <div className="bg-border/70 h-1.5 min-w-0 flex-1 overflow-hidden rounded-full">
                    <div
                      className="bg-primary h-full rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-muted w-14 shrink-0 text-end text-[10px] tabular-nums">
                    {row.sub}
                  </span>
                </div>
              );
            })}
        </div>
        <div className="flex gap-1 pt-0.5">
          {DAILY_STEPS.map((step) => {
            const done = Boolean(checklistDone[step.id]);
            const iconName =
              step.icon === "check"
                ? "know"
                : step.icon === "eye"
                  ? "eye"
                  : step.icon === "book"
                    ? "book"
                    : "rules";
            return (
              <Link
                key={step.id}
                href={step.href}
                title={step.label}
                aria-label={step.label}
                onClick={() => {
                  if (!done) toggleStep(step.id);
                }}
                className={
                  done
                    ? "bg-primary/15 text-primary inline-flex min-h-8 flex-1 items-center justify-center gap-1 rounded-md text-[10px] font-medium"
                    : "border-border text-muted hover:text-primary inline-flex min-h-8 flex-1 items-center justify-center gap-1 rounded-md border text-[10px]"
                }
              >
                <ActionIcon name={iconName} size={12} />
                {step.label}
              </Link>
            );
          })}
        </div>
      </section>

      {/* 5. Units — dense grid */}
      <section>
        <div className="mb-1.5 flex items-center justify-between">
          <h2 className="text-primary text-sm font-medium">Units</h2>
          <p className="text-muted text-[10px]">{focusLabel}</p>
        </div>
        <div className="grid grid-cols-6 gap-1 sm:grid-cols-8 md:grid-cols-10">
          {unitRings.map((u) => {
            const active = Number(focusUnit) === Number(u.unit);
            const pct = Math.round(u.combined);
            return (
              <button
                key={u.unit}
                type="button"
                onClick={() => selectFocus(u.unit)}
                title={`Unit ${u.unit} · ${u.wordsLearned}/${u.wordTotal}`}
                className={
                  active
                    ? "border-primary bg-primary/[0.12] rounded-md border px-0.5 py-1"
                    : "border-border/40 bg-surface/80 hover:border-primary/30 rounded-md border px-0.5 py-1"
                }
              >
                <span className="text-primary block text-center text-[11px] font-medium tabular-nums leading-none">
                  {u.unit}
                </span>
                <span className="bg-border/70 mx-auto mt-1 block h-0.5 w-[80%] overflow-hidden rounded-full">
                  <span
                    className="bg-primary block h-full rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 6. Ayah — always open */}
      <JourneyAyahCarousel />
    </div>
  );
}
