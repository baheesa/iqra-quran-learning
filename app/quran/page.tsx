import { AppShell } from "@/features/i18n/AppShell";
import { QuranReader } from "@/features/reading/components/QuranReader";
import { loadUnitVocabulary } from "@/features/knowledge/services/unit-vocabulary";
import {
  getJuzIndex,
  getSurahs,
} from "@/features/reading/services/quran-service";

type QuranPageProps = {
  searchParams: Promise<{ page?: string }>;
};

export default async function QuranRoutePage({ searchParams }: QuranPageProps) {
  const params = await searchParams;
  const hasExplicitPage = params.page !== undefined;
  const requested = Number(params.page ?? "1");
  const initialPage =
    Number.isInteger(requested) && requested >= 1 && requested <= 604
      ? requested
      : 1;

  const [surahs, juzIndex, vocab] = await Promise.all([
    getSurahs(),
    getJuzIndex(),
    loadUnitVocabulary(),
  ]);

  const wordFormById: Record<string, string> = {};
  for (const unit of vocab.units) {
    for (const word of unit.words) {
      wordFormById[word.id] = word.arabic;
    }
  }

  return (
    <AppShell>
      <main className="pb-10">
        <QuranReader
          initialPage={initialPage}
          resumeFromStorage={!hasExplicitPage}
          surahs={surahs}
          juzIndex={juzIndex}
          wordFormById={wordFormById}
        />
      </main>
    </AppShell>
  );
}
