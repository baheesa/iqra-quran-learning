"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { useUiLocale } from "@/features/i18n/locale-context";
import {
  FilterChip,
  FilterIcons,
  FilterRow,
  FilterSearch,
  FilterToolbar,
  learnedCardClass,
  LearnedToggle,
  loadLastWordsUnit,
  loadLearnedWordIds,
  NextRemainingButton,
  saveLastWordsUnit,
  saveLearnedWordIds,
  type ProgressFilter,
} from "@/features/knowledge/components/curriculum-filters";
import { HighlightedText } from "@/features/reading/components/HighlightedText";
import { normalizeArabic } from "@/features/teacher/domain/arabic";

export type WordListItem = {
  id: string;
  unit: number;
  number: number;
  arabic: string;
  meaning: string;
  kind: "word" | "phrase";
};

type KindFilter = "all" | "word" | "phrase";

type Props = {
  units: Array<{
    unit: number;
    wordCount: number;
    phraseCount: number;
    words: WordListItem[];
  }>;
  totalWords: number;
  totalPhrases: number;
};

function matchesQuery(item: WordListItem, query: string): boolean {
  const q = query.trim();
  if (!q) return true;
  const qNorm = normalizeArabic(q);
  if (qNorm && normalizeArabic(item.arabic).includes(qNorm)) return true;
  if (item.meaning.toLowerCase().includes(q.toLowerCase())) return true;
  return false;
}

export function UnitWordsBrowser({ units, totalWords, totalPhrases }: Props) {
  const { t } = useUiLocale();
  const [learned, setLearned] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState<ProgressFilter>("all");
  const [unitFilter, setUnitFilter] = useState<number | "all">("all");
  const [kind, setKind] = useState<KindFilter>("all");
  const [query, setQuery] = useState("");
  const [ready, setReady] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLearned(loadLearnedWordIds());
    const last = loadLastWordsUnit();
    if (last !== null) {
      if (last === "all") setUnitFilter("all");
      else if (units.some((u) => Number(u.unit) === Number(last))) {
        setUnitFilter(last);
      }
    }
    setReady(true);
  }, [units]);

  useEffect(() => {
    if (!ready) return;
    saveLastWordsUnit(unitFilter);
  }, [unitFilter, ready]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [unitFilter, progress, kind]);

  const digit = (n: number) => String(n);

  const flat = useMemo(() => {
    const source =
      unitFilter === "all"
        ? units
        : units.filter((unit) => Number(unit.unit) === Number(unitFilter));
    const items: WordListItem[] = [];
    for (const unit of source) {
      for (const word of unit.words) {
        if (kind !== "all" && word.kind !== kind) continue;
        items.push(word);
      }
    }
    return items;
  }, [units, unitFilter, kind]);

  const visible = useMemo(() => {
    return flat.filter((item) => {
      if (!matchesQuery(item, query)) return false;
      const isLearned = learned.has(item.id);
      if (progress === "learned") return isLearned;
      if (progress === "remaining") return !isLearned;
      return true;
    });
  }, [flat, learned, progress, query]);

  const remainingInScope = useMemo(() => {
    return flat.filter((item) => !learned.has(item.id) && matchesQuery(item, query))
      .length;
  }, [flat, learned, query]);

  const learnedCount = useMemo(() => {
    let n = 0;
    for (const unit of units) {
      for (const word of unit.words) {
        if (learned.has(word.id)) n += 1;
      }
    }
    return n;
  }, [learned, units]);

  const totalItems = totalWords + totalPhrases;

  function toggleLearned(id: string) {
    setLearned((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveLearnedWordIds(next);
      return next;
    });
  }

  function jumpToNextRemaining() {
    const next =
      visible.find((item) => !learned.has(item.id)) ??
      flat.find((item) => !learned.has(item.id) && matchesQuery(item, query));
    if (!next) return;
    if (progress === "learned") setProgress("remaining");
    requestAnimationFrame(() => {
      document.getElementById(`word-${next.id}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <FilterToolbar
        stats={
          <>
            <span className="text-foreground font-medium">
              {digit(visible.length)}
            </span>
            <span>
              {digit(ready ? learnedCount : 0)}✓ ·{" "}
              {digit(ready ? totalItems - learnedCount : totalItems)} left
            </span>
          </>
        }
        actions={
          <NextRemainingButton
            remainingCount={remainingInScope}
            onClick={jumpToNextRemaining}
            label={t("filter.nextRemaining")}
          />
        }
        search={
          <FilterSearch
            value={query}
            onChange={setQuery}
            placeholder={t("filter.search")}
          />
        }
      >
        <FilterRow label={t("filter.unit")}>
          <FilterChip
            active={unitFilter === "all"}
            label={t("filter.all")}
            icon={FilterIcons.all}
            onClick={() => setUnitFilter("all")}
          />
          {units.map((unit) => (
            <FilterChip
              key={unit.unit}
              active={Number(unitFilter) === Number(unit.unit)}
              label={`${digit(unit.unit)}`}
              title={`Unit ${unit.unit} · ${unit.wordCount + unit.phraseCount} items`}
              icon={FilterIcons.book}
              onClick={() => setUnitFilter(unit.unit)}
            />
          ))}
        </FilterRow>

        <FilterRow label={t("filter.progress")}>
          <FilterChip
            active={progress === "all"}
            label={t("filter.all")}
            icon={FilterIcons.all}
            onClick={() => setProgress("all")}
          />
          <FilterChip
            active={progress === "learned"}
            label={t("filter.learned")}
            icon={FilterIcons.learned}
            onClick={() => setProgress("learned")}
          />
          <FilterChip
            active={progress === "remaining"}
            label={t("filter.remaining")}
            icon={FilterIcons.remaining}
            onClick={() => setProgress("remaining")}
          />
        </FilterRow>

        <FilterRow label={t("filter.kind")}>
          <FilterChip
            active={kind === "all"}
            label={t("filter.all")}
            icon={FilterIcons.all}
            onClick={() => setKind("all")}
          />
          <FilterChip
            active={kind === "word"}
            label={t("filter.words")}
            icon={FilterIcons.word}
            onClick={() => setKind("word")}
          />
          <FilterChip
            active={kind === "phrase"}
            label={t("filter.phrases")}
            icon={FilterIcons.phrase}
            onClick={() => setKind("phrase")}
          />
        </FilterRow>
      </FilterToolbar>

      <div
        ref={listRef}
        key={`words-${unitFilter}-${progress}-${kind}-${query}-${visible.length}`}
        className="space-y-2.5 sm:space-y-3"
      >
        {visible.length === 0 ? (
          <p className="text-muted rounded-xl border border-dashed px-4 py-8 text-center text-sm">
            {t("filter.none")}
          </p>
        ) : null}

        {visible.map((item, index) => {
          const isLearned = learned.has(item.id);
          return (
            <article
              key={`${item.unit}-${item.id}-${item.number}-${index}`}
              id={`word-${item.id}`}
              className={learnedCardClass(isLearned)}
            >
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <span className="text-muted text-xs sm:text-sm">
                  {t("unitWords.unit", { unit: digit(item.unit) })} ·{" "}
                  {digit(item.number)} ·{" "}
                  {item.kind === "phrase"
                    ? t("unitWords.phrase")
                    : t("unitWords.word")}
                </span>
                <LearnedToggle
                  learned={isLearned}
                  onToggle={() => toggleLearned(item.id)}
                  markLabel={t("mark.learned")}
                  learnedLabel={t("mark.learnedYes")}
                />
              </div>
              <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                <p
                  className="font-quran text-primary text-xl leading-relaxed sm:text-2xl"
                  dir="rtl"
                  lang="ar"
                >
                  <HighlightedText text={item.arabic} query={query} />
                </p>
                <p
                  className="font-urdu text-foreground text-sm leading-relaxed sm:text-right sm:text-base"
                  dir="rtl"
                  lang="ur"
                >
                  <HighlightedText text={item.meaning} query={query} />
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
