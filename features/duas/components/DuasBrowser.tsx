"use client";

import { useEffect, useMemo, useState } from "react";

import duasData from "@/data/duas/daily-duas.json";
import {
  LearnedToggle,
  loadMemorizedDuaIds,
  saveMemorizedDuaIds,
} from "@/features/knowledge/components/curriculum-filters";
import { HighlightedText } from "@/features/reading/components/HighlightedText";
import { MushafOpenButton } from "@/features/reading/components/MushafOpenButton";
import { TappableArabicText } from "@/features/reading/components/TappableArabicText";

type DuaItem = {
  id: string;
  category: string;
  occasion: string;
  occasionUrdu: string;
  arabic: string;
  urdu: string;
  source: string;
  note?: string;
  order?: number;
  juz?: number;
  ref?: string;
  page?: number | null;
  surahNameEnglish?: string;
};

type Category = {
  id: string;
  label: string;
  labelUrdu: string;
};

const CATEGORIES = duasData.categories as Category[];
const DUAS = duasData.duas as DuaItem[];
const QURANIC_TOTAL = DUAS.filter((d) => d.category === "quranic").length;

export function DuasBrowser() {
  const [category, setCategory] = useState<string>("quranic");
  const [juz, setJuz] = useState<number | "all">("all");
  const [query, setQuery] = useState("");
  const [memorized, setMemorized] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);
  const [progressOnly, setProgressOnly] = useState<"all" | "todo" | "done">(
    "all",
  );

  useEffect(() => {
    setMemorized(loadMemorizedDuaIds());
    setReady(true);
  }, []);

  const memorizedCount = useMemo(() => {
    let n = 0;
    for (const d of DUAS) {
      if (d.category === "quranic" && memorized.has(d.id)) n += 1;
    }
    return n;
  }, [memorized]);

  const juzCounts = useMemo(() => {
    const map = new Map<number, number>();
    for (const d of DUAS) {
      if (d.category !== "quranic" || !d.juz) continue;
      map.set(d.juz, (map.get(d.juz) ?? 0) + 1);
    }
    return map;
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DUAS.filter((dua) => {
      if (category !== "all" && dua.category !== category) return false;
      if (
        (category === "quranic" || category === "all") &&
        juz !== "all" &&
        dua.category === "quranic" &&
        dua.juz !== juz
      ) {
        return false;
      }
      if (dua.category === "quranic") {
        const done = memorized.has(dua.id);
        if (progressOnly === "todo" && done) return false;
        if (progressOnly === "done" && !done) return false;
      }
      if (!q) return true;
      return (
        dua.occasion.toLowerCase().includes(q) ||
        dua.occasionUrdu.includes(query.trim()) ||
        dua.urdu.includes(query.trim()) ||
        dua.source.toLowerCase().includes(q) ||
        dua.arabic.includes(query.trim()) ||
        (dua.ref?.toLowerCase().includes(q) ?? false) ||
        (dua.surahNameEnglish?.toLowerCase().includes(q) ?? false) ||
        (dua.juz != null && `juz ${dua.juz}`.includes(q))
      );
    }).sort((a, b) => {
      if (a.category === "quranic" && b.category === "quranic") {
        return (
          (a.juz ?? 0) - (b.juz ?? 0) ||
          (a.page ?? 0) - (b.page ?? 0) ||
          (a.order ?? 0) - (b.order ?? 0)
        );
      }
      return 0;
    });
  }, [category, query, memorized, progressOnly, juz]);

  function toggleMemorized(id: string) {
    setMemorized((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveMemorizedDuaIds(next);
      return next;
    });
  }

  const pct =
    QURANIC_TOTAL > 0 ? Math.round((memorizedCount / QURANIC_TOTAL) * 100) : 0;

  return (
    <div className="space-y-4">
      <section className="border-primary/25 from-primary/[0.08] rounded-2xl border bg-gradient-to-br to-surface/95 px-3.5 py-3.5 sm:px-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-primary text-sm font-medium">Qur’anic duas</p>
            <p className="text-muted text-xs">
              {ready ? memorizedCount : "—"}/{QURANIC_TOTAL} memorized · juz 1–30
            </p>
          </div>
          <p className="text-primary text-2xl font-medium tabular-nums">{pct}%</p>
        </div>
        <div className="bg-border/70 mt-3 h-2 overflow-hidden rounded-full">
          <div
            className="bg-primary h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </section>

      <div className="border-border/80 bg-surface/95 sticky top-14 z-10 space-y-2 rounded-xl border px-3 py-2.5 shadow-sm backdrop-blur-md sm:top-16">
        <div className="flex gap-2">
          <label className="border-border bg-background/70 flex min-w-0 flex-1 items-center gap-2 rounded-lg border px-2.5 py-2">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="text-foreground placeholder:text-muted min-w-0 flex-1 bg-transparent text-sm outline-none"
              dir="auto"
            />
          </label>
          {(category === "quranic" || category === "all") && (
            <label className="border-border bg-background/70 shrink-0 rounded-lg border">
              <span className="sr-only">Juz</span>
              <select
                value={juz === "all" ? "all" : String(juz)}
                onChange={(e) => {
                  const v = e.target.value;
                  setJuz(v === "all" ? "all" : Number(v));
                }}
                className="text-foreground max-w-[7.5rem] bg-transparent px-2 py-2 text-xs outline-none"
              >
                <option value="all">All juz</option>
                {Array.from({ length: 30 }, (_, i) => i + 1).map((j) => {
                  const count = juzCounts.get(j) ?? 0;
                  return (
                    <option key={j} value={j} disabled={count === 0}>
                      Juz {j}
                      {count ? ` (${count})` : ""}
                    </option>
                  );
                })}
              </select>
            </label>
          )}
        </div>

        <div className="scrollbar-none flex gap-1.5 overflow-x-auto pb-0.5">
          <button
            type="button"
            onClick={() => setCategory("all")}
            className={chipClass(category === "all")}
          >
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setCategory(cat.id);
                if (cat.id !== "quranic") setJuz("all");
              }}
              className={chipClass(category === cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {category === "quranic" || category === "all" ? (
          <div className="flex gap-1.5">
            {(
              [
                ["all", "All"],
                ["todo", "To learn"],
                ["done", "Memorized"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setProgressOnly(id)}
                className={
                  progressOnly === id
                    ? "bg-primary/15 text-primary rounded-md px-2.5 py-1 text-[11px] font-medium"
                    : "text-muted rounded-md px-2.5 py-1 text-[11px]"
                }
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}
        <p className="text-muted text-[11px]">{visible.length} shown</p>
      </div>

      <div className="space-y-3">
        {visible.length === 0 ? (
          <p className="text-muted rounded-xl border border-dashed px-4 py-8 text-center text-sm">
            Nothing matches.
          </p>
        ) : null}

        {visible.map((dua, index) => {
          const isQuranic = dua.category === "quranic";
          const done = memorized.has(dua.id);
          const prev = visible[index - 1];
          const showJuzHeader =
            isQuranic &&
            dua.juz != null &&
            (!prev || prev.category !== "quranic" || prev.juz !== dua.juz);

          return (
            <div key={dua.id} className="space-y-2">
              {showJuzHeader ? (
                <p className="text-muted px-1 pt-1 text-[11px] font-medium tracking-wide uppercase">
                  Juz {dua.juz}
                </p>
              ) : null}
              <article
                className={
                  done
                    ? "border-primary/30 bg-primary/[0.07] rounded-2xl border px-3.5 py-3.5 sm:px-4 sm:py-4"
                    : "border-border/70 bg-surface/90 rounded-2xl border px-3.5 py-3.5 sm:px-4 sm:py-4"
                }
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-primary text-sm font-medium">
                      {isQuranic && dua.order ? (
                        <span className="text-muted me-1.5 tabular-nums">
                          #{dua.order}
                        </span>
                      ) : null}
                      <HighlightedText
                        text={
                          isQuranic && dua.surahNameEnglish && dua.ref
                            ? `${dua.surahNameEnglish} · ${dua.ref}`
                            : dua.occasion
                        }
                        query={query}
                      />
                    </p>
                    <p
                      className="font-urdu text-muted mt-0.5 text-sm"
                      dir="rtl"
                      lang="ur"
                    >
                      <HighlightedText
                        text={
                          isQuranic && dua.ref
                            ? `قرآن ${dua.ref}`
                            : dua.occasionUrdu
                        }
                        query={query}
                      />
                    </p>
                    {dua.page || dua.juz ? (
                      <p className="text-muted mt-1 text-[11px]">
                        {dua.juz ? `Juz ${dua.juz}` : ""}
                        {dua.juz && dua.page ? " · " : ""}
                        {dua.page ? `p.${dua.page}` : ""}
                      </p>
                    ) : null}
                  </div>
                  {isQuranic ? (
                    <LearnedToggle
                      learned={done}
                      onToggle={() => toggleMemorized(dua.id)}
                      markLabel="Mark memorized"
                      learnedLabel="Memorized"
                    />
                  ) : null}
                </div>

                <div
                  className="font-quran text-primary text-[1.35rem] leading-[2.15] sm:text-2xl"
                  dir="rtl"
                  lang="ar"
                >
                  <TappableArabicText
                    arabic={dua.arabic}
                    ayahRef={dua.ref}
                    query={query}
                    fallbackMeaning={dua.urdu}
                  />
                </div>
                <p
                  className="font-urdu text-foreground mt-3 text-base leading-relaxed sm:text-lg"
                  dir="rtl"
                  lang="ur"
                >
                  <HighlightedText text={dua.urdu} query={query} />
                </p>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-muted text-[11px]">{dua.source}</p>
                  {dua.page ? <MushafOpenButton page={dua.page} /> : null}
                </div>
              </article>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function chipClass(active: boolean): string {
  return active
    ? "bg-primary text-white shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium"
    : "border-border text-muted shrink-0 rounded-lg border px-3 py-1.5 text-xs";
}
