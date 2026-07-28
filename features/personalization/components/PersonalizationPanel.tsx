import Link from "next/link";

import type {
  LearnerInsights,
  Recommendation,
  StudyPlan,
} from "@/features/personalization/types";

type Props = {
  recommendations: Recommendation[];
  insights: LearnerInsights;
  plan: StudyPlan;
  unit: number;
  lessonTitle: string | null;
  explanationStyle: string;
};

function trendLabel(trend: string): string {
  if (trend === "rising") return "Rising";
  if (trend === "falling") return "Falling";
  return "Steady";
}

function styleLabel(style: string): string {
  if (style === "brief") return "Brief";
  if (style === "detailed") return "Detailed";
  return "Guided";
}

export function PersonalizationPanel({
  recommendations,
  insights,
  plan,
  unit,
  lessonTitle,
  explanationStyle,
}: Props) {
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="text-primary text-lg font-medium tracking-tight sm:text-xl">
          For you today
        </h2>
        <ul className="space-y-1">
          {recommendations.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className="border-border/50 hover:bg-surface/60 block rounded-lg border-b px-1 py-2.5 transition-colors"
              >
                <p className="font-urdu text-base leading-relaxed" dir="rtl" lang="ur">
                  {item.titleUrdu}
                </p>
                <p
                  className="font-urdu text-muted mt-0.5 text-sm"
                  dir="rtl"
                  lang="ur"
                >
                  {item.reasonUrdu}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-border/50 bg-surface/70 space-y-2 rounded-xl border px-4 py-4 backdrop-blur-sm">
        <h2 className="text-primary text-lg font-medium tracking-tight">
          Today&apos;s plan
        </h2>
        <p className="text-muted text-sm">
          ~{plan.targetMinutes} min · {styleLabel(explanationStyle)} explanations
        </p>
        <ol className="list-inside list-decimal space-y-2">
          {plan.items.map((item) => (
            <li key={`${item.order}-${item.kind}`}>
              <Link href={item.href} className="hover:text-primary">
                <span className="font-urdu" dir="rtl" lang="ur">
                  {item.titleUrdu}
                </span>
              </Link>
              <span className="text-muted text-sm">
                {" "}
                (~{item.estimatedMinutes} min)
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="border-border/50 bg-surface/70 rounded-xl border px-4 py-4 backdrop-blur-sm">
          <h2 className="text-primary mb-2 text-sm font-medium tracking-tight">
            This week
          </h2>
          <p className="text-sm">Sessions: {insights.weeklySummary.sessionsCompleted}</p>
          <p className="text-sm">Minutes: {insights.weeklySummary.minutesStudied}</p>
          <p className="text-sm">Words touched: {insights.weeklySummary.wordsTouched}</p>
          <p className="text-sm">Reviews due: {insights.weeklySummary.reviewsDue}</p>
        </div>
        <div className="border-border/50 bg-surface/70 rounded-xl border px-4 py-4 backdrop-blur-sm">
          <h2 className="text-primary mb-2 text-sm font-medium tracking-tight">
            Confidence & reading
          </h2>
          <p className="text-sm">Avg confidence: {insights.averageConfidence}%</p>
          <p className="text-sm">Trend: {trendLabel(insights.confidenceTrend)}</p>
          <p className="text-sm">
            Streak: {insights.readingConsistency.streak}d · last 7d active{" "}
            {insights.readingConsistency.daysActiveLast7}
          </p>
          <p className="text-muted mt-1 text-xs">
            Unit {unit}
            {lessonTitle ? ` · ${lessonTitle}` : ""}
          </p>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="border-border/50 bg-surface/70 rounded-xl border px-4 py-4 backdrop-blur-sm">
          <h2 className="text-primary mb-2 text-sm font-medium tracking-tight">
            Most improved
          </h2>
          <ul className="space-y-1">
            {insights.mostImprovedVocabulary.length === 0 ? (
              <li className="text-muted text-sm">Not enough data yet</li>
            ) : (
              insights.mostImprovedVocabulary.map((item) => (
                <li key={item.id} className="font-quran text-xl" dir="rtl" lang="ar">
                  {item.arabic}
                </li>
              ))
            )}
          </ul>
        </div>
        <div className="border-border/50 bg-surface/70 rounded-xl border px-4 py-4 backdrop-blur-sm">
          <h2 className="text-primary mb-2 text-sm font-medium tracking-tight">
            Most difficult
          </h2>
          <ul className="space-y-1">
            {insights.mostDifficultVocabulary.length === 0 ? (
              <li className="text-muted text-sm">Not enough data yet</li>
            ) : (
              insights.mostDifficultVocabulary.map((item) => (
                <li key={item.id} className="flex justify-between gap-2">
                  <span className="font-quran text-xl" dir="rtl" lang="ar">
                    {item.arabic}
                  </span>
                  <span className="text-muted text-sm">{item.confidence}%</span>
                </li>
              ))
            )}
          </ul>
        </div>
      </section>
    </div>
  );
}
