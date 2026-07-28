import { AppShell } from "@/features/i18n/AppShell";
import { AyahsPageHeader } from "@/features/i18n/page-headers";
import { UnitAyahsBrowser } from "@/features/knowledge/components/UnitAyahsBrowser";
import { loadUnitAyahs } from "@/features/knowledge/services/unit-ayahs";

export const dynamic = "force-dynamic";

export default async function UnitAyahsPage() {
  const { totalAyahs, units, withMeaning } = await loadUnitAyahs();

  return (
    <AppShell>
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 md:px-6">
        <AyahsPageHeader empty={units.length === 0} />

        {units.length === 0 ? null : (
          <UnitAyahsBrowser
            units={units.map((unit) => ({
              unit: unit.unit,
              ayahCount: unit.ayahCount,
              withMeaning: unit.withMeaning,
              ayahs: unit.ayahs.map((ayah) => ({
                id: ayah.id,
                unit: ayah.unit,
                number: ayah.number ?? 0,
                arabic: ayah.arabic,
                meaning: ayah.meaning,
                ref: ayah.ref,
              })),
            }))}
            totalAyahs={totalAyahs}
            withMeaning={withMeaning}
          />
        )}
      </main>
    </AppShell>
  );
}
