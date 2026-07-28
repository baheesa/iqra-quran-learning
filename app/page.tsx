import { AppShell } from "@/features/i18n/AppShell";
import { LearnerHome } from "@/features/learning/components/LearnerHome";
import type {
  PracticeWord,
  UnitProgressSeed,
} from "@/features/learning/components/LearnerHome";
import { getLearningEngine } from "@/features/learning/server";
import { loadUnitAyahIdIndex } from "@/features/knowledge/services/unit-ayahs";
import { loadUnitVocabulary } from "@/features/knowledge/services/unit-vocabulary";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const learning = getLearningEngine();
  const dashboard = learning.analytics.getDashboard();
  const [vocab, ayahIndex] = await Promise.all([
    loadUnitVocabulary(),
    loadUnitAyahIdIndex(),
  ]);

  const ayahIdsByUnit = new Map(
    ayahIndex.map((row) => [row.unit, row.ayahIds] as const),
  );

  const units: UnitProgressSeed[] = vocab.units.map((unit) => ({
    unit: unit.unit,
    wordIds: unit.words.map((w) => w.id),
    ayahIds: ayahIdsByUnit.get(unit.unit) ?? [],
  }));

  /** Full curriculum pool — Home picks a fresh daily slice client-side. */
  const practiceWords: PracticeWord[] = vocab.units.flatMap((unit) =>
    unit.words
      .filter((w) => Boolean(w.meaning?.trim()))
      .map((w, index) => ({
        id: w.id,
        arabic: w.arabic,
        meaning: w.meaning,
        unit: w.unit,
        number: index + 1,
      })),
  );

  return (
    <AppShell>
      <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-lg px-4 py-5 sm:max-w-2xl sm:px-6 sm:py-8">
        <LearnerHome
          dashboard={dashboard}
          units={units}
          practiceWords={practiceWords}
        />
      </main>
    </AppShell>
  );
}
