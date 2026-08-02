"use client";

import { useEffect, useMemo, useState } from "react";

import {
  FilterChip,
  FilterIcons,
  FilterRow,
  FilterToolbar,
  loadLastRulesUnit,
  saveLastRulesUnit,
} from "@/features/knowledge/components/curriculum-filters";
import type { LearnerRule } from "@/features/knowledge/services/rules-browser";
import { useUiLocale } from "@/features/i18n/locale-context";
import { UnitLabel } from "@/features/i18n/rules-labels";
import { TappableArabicText } from "@/features/reading/components/TappableArabicText";

type Props = {
  rules: LearnerRule[];
};

function RuleCard({
  rule,
  expandAll,
}: {
  rule: LearnerRule;
  expandAll: boolean;
}) {
  const { t } = useUiLocale();
  const examples = rule.examples.length > 0
    ? rule.examples
    : rule.example
      ? [{ arabic: rule.example, meaning: null }]
      : [];
  const [open, setOpen] = useState(false);
  const showAll = expandAll || open;
  const visible = showAll ? examples : examples.slice(0, 1);
  const hiddenCount = Math.max(0, examples.length - 1);

  useEffect(() => {
    if (expandAll) setOpen(true);
  }, [expandAll]);

  return (
    <article className="border-border/70 bg-surface/85 rounded-2xl border px-3.5 py-3 sm:px-4 sm:py-3.5">
      <p
        className="font-quran text-primary text-2xl leading-relaxed"
        dir="rtl"
        lang="ar"
      >
        {rule.title}
      </p>
      <p
        className="font-urdu text-foreground mt-1.5 text-base leading-relaxed sm:text-lg"
        dir="rtl"
        lang="ur"
      >
        {rule.definition}
      </p>

      {visible.length > 0 ? (
        <div className="border-border/50 mt-3 space-y-2 border-t pt-2.5">
          <p className="text-muted text-xs tracking-wide uppercase">
            {t("rules.examples")} ({examples.length})
          </p>
          <ol className="space-y-2.5">
            {visible.map((example, index) => (
              <li key={`${rule.id}-ex-${index}`} className="space-y-0.5">
                <div
                  className="font-quran text-primary text-lg leading-relaxed sm:text-xl"
                  dir="rtl"
                  lang="ar"
                >
                  <span className="text-muted ml-2 font-ui text-xs">
                    {index + 1}.
                  </span>
                  <TappableArabicText
                    arabic={example.arabic}
                    fallbackMeaning={example.meaning}
                  />
                </div>
                {example.meaning ? (
                  <p
                    className="font-urdu text-muted pr-5 text-sm leading-relaxed sm:text-base"
                    dir="rtl"
                    lang="ur"
                  >
                    {example.meaning}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
          {!expandAll && hiddenCount > 0 ? (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="border-border text-primary hover:bg-primary/5 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium"
            >
              {open
                ? t("rules.showLess")
                : t("rules.moreExamples", { count: String(hiddenCount) })}
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

export function RulesBrowser({ rules }: Props) {
  const { t } = useUiLocale();
  const [unitFilter, setUnitFilter] = useState<number | "all">("all");
  const [expandAll, setExpandAll] = useState(false);
  const [ready, setReady] = useState(false);

  const units = useMemo(() => {
    const set = new Set(rules.map((r) => r.unit));
    return [...set].sort((a, b) => a - b);
  }, [rules]);

  useEffect(() => {
    const last = loadLastRulesUnit();
    if (last !== null) {
      if (last === "all") setUnitFilter("all");
      else if (units.some((u) => Number(u) === Number(last))) {
        setUnitFilter(last);
      }
    }
    setReady(true);
  }, [units]);

  useEffect(() => {
    if (!ready) return;
    saveLastRulesUnit(unitFilter);
  }, [unitFilter, ready]);

  const unitCounts = useMemo(() => {
    const map = new Map<number, number>();
    for (const rule of rules) {
      map.set(rule.unit, (map.get(rule.unit) ?? 0) + 1);
    }
    return map;
  }, [rules]);

  const visible = useMemo(() => {
    if (unitFilter === "all") return rules;
    return rules.filter((r) => Number(r.unit) === Number(unitFilter));
  }, [rules, unitFilter]);

  const groups = useMemo(() => {
    const map = new Map<number, LearnerRule[]>();
    for (const rule of visible) {
      const list = map.get(rule.unit) ?? [];
      list.push(rule);
      map.set(rule.unit, list);
    }
    return [...map.entries()]
      .sort(([a], [b]) => a - b)
      .map(([unit, unitRules]) => ({ unit, rules: unitRules }));
  }, [visible]);

  const withExtras = visible.filter((r) => r.examples.length > 1).length;

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [unitFilter, expandAll]);

  return (
    <div className="space-y-5">
      <FilterToolbar
        stats={
          <>
            <span className="text-foreground font-medium">
              {visible.length} qawaid
            </span>
            <span>
              {withExtras} with extras
              {unitFilter === "all" ? ` · ${rules.length}` : ""}
            </span>
          </>
        }
        actions={
          <button
            type="button"
            onClick={() => setExpandAll((v) => !v)}
            title={
              expandAll ? t("rules.collapseExamples") : t("rules.expandExamples")
            }
            aria-label={
              expandAll ? t("rules.collapseExamples") : t("rules.expandExamples")
            }
            className={
              expandAll
                ? "bg-primary text-on-primary inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-medium"
                : "border-border text-primary hover:bg-primary/5 inline-flex h-8 items-center gap-1 rounded-lg border px-2 text-xs font-medium"
            }
          >
            {FilterIcons.book}
            <span className="hidden sm:inline">
              {expandAll ? t("rules.collapseExamples") : t("rules.expandExamples")}
            </span>
          </button>
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
              key={unit}
              active={Number(unitFilter) === Number(unit)}
              label={`${unit}`}
              title={`Unit ${unit} · ${unitCounts.get(unit) ?? 0} qawaid`}
              icon={FilterIcons.book}
              onClick={() => setUnitFilter(unit)}
            />
          ))}
        </FilterRow>
      </FilterToolbar>

      {groups.length === 0 ? (
        <p className="text-muted rounded-xl border border-dashed px-4 py-10 text-center text-sm">
          {t("filter.none")}
        </p>
      ) : (
        groups.map(({ unit, rules: unitRules }) => (
          <section key={unit} className="space-y-3">
            <h2 className="text-primary border-border/60 border-b pb-2 text-lg sm:text-xl">
              <UnitLabel unit={unit} />
              <span className="text-muted ml-2 text-sm font-normal">
                ({unitRules.length})
              </span>
            </h2>
            <div className="space-y-3">
              {unitRules.map((rule) => (
                <RuleCard
                  key={rule.id}
                  rule={rule}
                  expandAll={expandAll}
                />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
