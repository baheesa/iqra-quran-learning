import { AppShell } from "@/features/i18n/AppShell";
import { CurriculumPageHeader } from "@/features/i18n/page-headers";
import { UnitWordsBrowser } from "@/features/knowledge/components/UnitWordsBrowser";
import { loadUnitVocabulary } from "@/features/knowledge/services/unit-vocabulary";

export const dynamic = "force-dynamic";

export default async function CurriculumWordsPage() {
  const { totalWords, totalPhrases, units } = await loadUnitVocabulary();

  const browserUnits = units.map((unit) => {
    const words = unit.words.map((word, index) => ({
      id: word.id,
      unit: word.unit,
      number: index + 1,
      arabic: word.arabic,
      meaning: word.meaning,
      kind: (word.kind === "phrase" ? "phrase" : "word") as "word" | "phrase",
    }));
    return {
      unit: unit.unit,
      wordCount: unit.wordCount,
      phraseCount: unit.phraseCount ?? 0,
      words,
    };
  });

  return (
    <AppShell>
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 md:px-6">
        <CurriculumPageHeader empty={units.length === 0} />

        {units.length === 0 ? null : (
          <UnitWordsBrowser
            units={browserUnits}
            totalWords={totalWords}
            totalPhrases={totalPhrases}
          />
        )}
      </main>
    </AppShell>
  );
}
