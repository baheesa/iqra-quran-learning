"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { stageLabelEn } from "@/features/learning/domain/stages";
import type { DashboardSummary } from "@/features/learning/types";
import { QURAN_PAGE_COUNT } from "@/features/reading/constants";
import { createProgressService } from "@/features/reading/services/progress-service";
import { createBrowserLocalStorage } from "@/lib/storage/adapter";

type Props = {
  dashboard: DashboardSummary;
};

function Donut(props: {
  percent: number;
  label: string;
  sub: string;
  tone?: "primary" | "accent" | "warning";
}) {
  const pct = Math.max(0, Math.min(100, Math.round(props.percent)));
  const r = 36;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  const stroke =
    props.tone === "accent"
      ? "var(--accent)"
      : props.tone === "warning"
        ? "var(--warning)"
        : "var(--primary)";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-24 w-24">
        <svg viewBox="0 0 96 96" className="h-full w-full -rotate-90" aria-hidden>
          <circle
            cx="48"
            cy="48"
            r={r}
            fill="none"
            stroke="var(--border)"
            strokeWidth="8"
          />
          <circle
            cx="48"
            cy="48"
            r={r}
            fill="none"
            stroke={stroke}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-primary text-lg font-medium">{pct}%</span>
        </div>
      </div>
      <p className="text-foreground text-sm font-medium">{props.label}</p>
      <p className="text-muted max-w-[10rem] text-center text-xs leading-snug">
        {props.sub}
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border-border/50 bg-surface/75 rounded-xl border px-3 py-3 backdrop-blur-sm">
      <p className="text-muted text-[10px] tracking-wide uppercase sm:text-xs">
        {label}
      </p>
      <p className="text-primary mt-1 text-2xl font-medium tracking-tight">
        {value}
      </p>
    </div>
  );
}

export function DashboardSummaryView({ dashboard }: Props) {
  const [pagesVisited, setPagesVisited] = useState(0);
  const [currentPage, setCurrentPage] = useState(dashboard.currentPage);

  useEffect(() => {
    try {
      const progress = createProgressService(createBrowserLocalStorage());
      setPagesVisited(progress.getVisitedPages().length);
      const pos = progress.getPosition();
      if (pos?.page) setCurrentPage(pos.page);
    } catch {
      // ignore
    }
  }, []);

  const readingPct = useMemo(
    () => (pagesVisited / QURAN_PAGE_COUNT) * 100,
    [pagesVisited],
  );

  const vocabDenom = dashboard.knownWords + dashboard.wordsInProgress;
  const vocabPct =
    vocabDenom > 0 ? (dashboard.knownWords / vocabDenom) * 100 : 0;

  const weakFocus = dashboard.weakestVocabulary.slice(0, 3);

  return (
    <div className="space-y-8">
      <section className="border-border/50 from-primary/[0.07] relative overflow-hidden rounded-2xl border bg-gradient-to-br via-surface/80 to-transparent px-4 py-6 sm:px-6">
        {/* Soft mushaf atmosphere — decorative, not a photo of sacred text */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.09]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='200' viewBox='0 0 160 200'%3E%3Crect x='18' y='12' width='124' height='176' rx='6' fill='none' stroke='%231e4a38' stroke-width='2'/%3E%3Cpath d='M40 48h80M40 68h80M40 88h70M40 108h80M40 128h60M40 148h75' stroke='%231e4a38' stroke-width='1.5' stroke-linecap='round' opacity='0.5'/%3E%3C/svg%3E")`,
            backgroundSize: "140px 175px",
            backgroundPosition: "right -20px center",
            backgroundRepeat: "no-repeat",
          }}
          aria-hidden
        />
        <div className="relative">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-muted text-xs tracking-wide uppercase">
                Your journey
              </p>
              <h2 className="text-primary text-xl tracking-tight sm:text-2xl">
                Reading & recognition
              </h2>
              <p className="text-muted mt-1 max-w-md text-xs leading-relaxed sm:text-sm">
                Pages opened and words you know — not “how much of the Quran you
                understand.” Gaps below show where to strengthen.
              </p>
            </div>
            <Link
              href="/quran"
              className="bg-primary text-white rounded-lg px-3.5 py-2 text-xs font-medium sm:text-sm"
            >
              Continue reading
            </Link>
          </div>

          <div className="flex flex-wrap justify-around gap-6">
            <Donut
              percent={readingPct}
              label="Mushaf pages"
              sub={`${pagesVisited} of ${QURAN_PAGE_COUNT} opened · now p.${currentPage}`}
            />
            <Donut
              percent={vocabPct}
              label="Word progress"
              sub={`${dashboard.knownWords} known · ${dashboard.wordsInProgress} in progress`}
              tone="accent"
            />
            <Donut
              percent={Math.min(100, dashboard.todayLearningMinutes * 5)}
              label="Today’s focus"
              sub={`${dashboard.todayLearningMinutes} min · streak ${dashboard.readingStreak}d`}
              tone="warning"
            />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
        <Stat label="Known words" value={dashboard.knownWords} />
        <Stat label="In progress" value={dashboard.wordsInProgress} />
        <Stat label="Rules mastered" value={dashboard.rulesMastered} />
        <Stat label="Review due" value={dashboard.reviewDue} />
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="border-border/50 bg-surface/75 rounded-xl border px-4 py-4 backdrop-blur-sm">
          <h3 className="text-primary mb-2 text-sm font-medium tracking-tight">
            Where you are
          </h3>
          <p className="text-foreground text-sm">
            Juz {dashboard.currentJuz} · Page {currentPage}
          </p>
          <p className="text-muted mt-2 text-sm">
            {dashboard.currentLesson?.title ?? "No lesson selected yet"}
          </p>
          {dashboard.session ? (
            <p className="text-muted mt-2 text-xs">
              Session: {dashboard.session.phase} · ~
              {dashboard.session.estimatedRemainingMinutes ?? "—"} min left
            </p>
          ) : (
            <p className="text-muted mt-2 text-xs">No active session</p>
          )}
        </div>

        <div className="border-border/50 bg-surface/75 rounded-xl border px-4 py-4 backdrop-blur-sm">
          <h3 className="text-primary mb-2 text-sm font-medium tracking-tight">
            Where to strengthen
          </h3>
          {weakFocus.length === 0 ? (
            <p className="text-muted text-sm">
              Keep reading — weak spots appear as you mark words.
            </p>
          ) : (
            <ul className="space-y-2">
              {weakFocus.map((item) => (
                <li
                  key={item.id}
                  className="flex items-baseline justify-between gap-3"
                >
                  <span className="font-quran text-lg" dir="rtl" lang="ar">
                    {item.arabic}
                  </span>
                  <span className="text-muted text-xs">{item.confidence}%</span>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/curriculum"
            className="text-primary mt-3 inline-block text-xs font-medium underline-offset-2 hover:underline"
          >
            Review unit words →
          </Link>
        </div>
      </section>

      <section className="border-border/50 bg-surface/75 rounded-xl border px-4 py-4 backdrop-blur-sm">
        <h3 className="text-primary mb-3 text-sm font-medium tracking-tight">
          Recently learned
        </h3>
        {dashboard.recentlyLearned.length === 0 ? (
          <p className="text-muted text-sm">
            Nothing yet — open the Quran and tap words.
          </p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {dashboard.recentlyLearned.slice(0, 6).map((item) => (
              <li
                key={item.id}
                className="flex items-baseline justify-between gap-3"
              >
                <span className="font-quran text-xl" dir="rtl" lang="ar">
                  {item.arabic}
                </span>
                <span className="text-muted text-xs">
                  {stageLabelEn(item.stage)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
