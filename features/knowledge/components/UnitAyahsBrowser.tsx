"use client";

import { useEffect, useMemo, useState } from "react";

import { useUiLocale } from "@/features/i18n/locale-context";
import {
  FilterChip,
  FilterIcons,
  FilterRow,
  FilterSearch,
  FilterToolbar,
  learnedCardClass,
  LearnedToggle,
  loadLastAyahsUnit,
  loadLearnedAyahIds,
  NextRemainingButton,
  saveLastAyahsUnit,
  saveLearnedAyahIds,
  type ProgressFilter,
} from "@/features/knowledge/components/curriculum-filters";
import { HighlightedText } from "@/features/reading/components/HighlightedText";
import { TappableArabicText } from "@/features/reading/components/TappableArabicText";
import { normalizeArabic } from "@/features/teacher/domain/arabic";

export type AyahListItem = {
  id: string;
  unit: number;
  number: number;
  arabic: string;
  meaning: string | null;
  ref?: string | null;
};

type Props = {
  units: Array<{
    unit: number;
    ayahCount: number;
    withMeaning?: number;
    ayahs: AyahListItem[];
  }>;
  totalAyahs: number;
  withMeaning: number;
};

function sameUnit(a: number, b: number | "all"): boolean {
  return b !== "all" && Number(a) === Number(b);
}

function matchesQuery(ayah: AyahListItem, query: string): boolean {
  const q = query.trim();
  if (!q) return true;
  const qNorm = normalizeArabic(q);
  if (qNorm && normalizeArabic(ayah.arabic).includes(qNorm)) return true;
  if (ayah.meaning?.toLowerCase().includes(q.toLowerCase())) return true;
  if (ayah.ref?.toLowerCase().includes(q.toLowerCase())) return true;
  return false;
}

export function UnitAyahsBrowser({ units, totalAyahs, withMeaning }: Props) {
  const { t } = useUiLocale();
  const [learned, setLearned] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState<ProgressFilter>("all");
  const [unitFilter, setUnitFilter] = useState<number | "all">("all");
  const [query, setQuery] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLearned(loadLearnedAyahIds());
    const last = loadLastAyahsUnit();
    if (last !== null) {
      if (last === "all") setUnitFilter("all");
      else if (units.some((u) => sameUnit(u.unit, last))) {
        setUnitFilter(last);
      }
    }
    setReady(true);
  }, [units]);

  useEffect(() => {
    if (!ready) return;
    saveLastAyahsUnit(unitFilter);
  }, [unitFilter, ready]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [unitFilter, progress]);

  const digit = (n: number) => String(n);

  const flat = useMemo(() => {
    if (unitFilter === "all") {
      return units.flatMap((unit) => unit.ayahs);
    }
    const selected = units.find((unit) => sameUnit(unit.unit, unitFilter));
    return selected ? [...selected.ayahs] : [];
  }, [units, unitFilter]);

  const visible = useMemo(() => {
    return flat.filter((ayah) => {
      if (!matchesQuery(ayah, query)) return false;
      const isLearned = learned.has(ayah.id);
      if (progress === "learned") return isLearned;
      if (progress === "remaining") return !isLearned;
      return true;
    });
  }, [flat, learned, progress, query]);

  const remainingInScope = useMemo(() => {
    return flat.filter((ayah) => !learned.has(ayah.id) && matchesQuery(ayah, query))
      .length;
  }, [flat, learned, query]);

  const learnedCount = useMemo(() => {
    let n = 0;
    for (const unit of units) {
      for (const ayah of unit.ayahs) {
        if (learned.has(ayah.id)) n += 1;
      }
    }
    return n;
  }, [learned, units]);

  function selectUnit(next: number | "all") {
    setUnitFilter(next);
  }

  function toggleLearned(id: string) {
    setLearned((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveLearnedAyahIds(next);
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
      document.getElementById(`ayah-${next.unit}-${next.id}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
  }

  const listKey = `ayahs-${unitFilter}-${progress}-${query}-${visible.length}`;

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
              {digit(ready ? totalAyahs - learnedCount : totalAyahs)} left
            </span>
            <span className="text-muted/80 hidden sm:inline">
              {digit(withMeaning)} glossed
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
            onClick={() => selectUnit("all")}
          />
          {units.map((unit) => (
            <FilterChip
              key={unit.unit}
              active={sameUnit(unit.unit, unitFilter)}
              label={`${digit(unit.unit)}`}
              title={`Unit ${unit.unit} · ${unit.ayahCount} ayahs`}
              icon={FilterIcons.book}
              onClick={() => selectUnit(unit.unit)}
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
      </FilterToolbar>

      <div key={listKey} className="space-y-2.5 sm:space-y-3">
        {visible.length === 0 ? (
          <p className="text-muted rounded-xl border border-dashed px-4 py-8 text-center text-sm">
            {t("filter.none")}
          </p>
        ) : null}

        {visible.map((ayah, index) => {
          const isLearned = learned.has(ayah.id);
          const rowKey = `${ayah.unit}-${ayah.id}-${ayah.number}-${index}`;
          return (
            <article
              key={rowKey}
              id={`ayah-${ayah.unit}-${ayah.id}`}
              className={learnedCardClass(isLearned)}
            >
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <span className="text-muted text-xs sm:text-sm">
                  {t("unitWords.unit", { unit: digit(ayah.unit) })} ·{" "}
                  {digit(ayah.number)}
                  {ayah.ref ? ` · ${ayah.ref}` : ""}
                </span>
                <LearnedToggle
                  learned={isLearned}
                  onToggle={() => toggleLearned(ayah.id)}
                  markLabel={t("mark.learned")}
                  learnedLabel={t("mark.learnedYes")}
                />
              </div>
              <div
                className="font-quran text-primary text-xl leading-relaxed sm:text-2xl"
                dir="rtl"
                lang="ar"
              >
                <TappableArabicText
                  arabic={ayah.arabic}
                  ayahRef={ayah.ref}
                  query={query}
                  fallbackMeaning={ayah.meaning}
                />
              </div>
              {ayah.meaning ? (
                <p
                  className="font-urdu text-foreground mt-1.5 text-sm leading-relaxed sm:text-base"
                  dir="rtl"
                  lang="ur"
                >
                  <HighlightedText text={ayah.meaning} query={query} />
                </p>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}
