import { AppShell } from "@/features/i18n/AppShell";
import { RulesPageHeader } from "@/features/i18n/page-headers";
import { RulesBrowser } from "@/features/knowledge/components/RulesBrowser";
import { loadMuallimRulesChronological } from "@/features/knowledge/services/rules-browser";

export const dynamic = "force-dynamic";

export default async function RulesPage() {
  const rules = await loadMuallimRulesChronological();

  return (
    <AppShell>
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-6 sm:gap-6 sm:py-8 md:px-6">
        <RulesPageHeader empty={rules.length === 0} />
        {rules.length > 0 ? <RulesBrowser rules={rules} /> : null}
      </main>
    </AppShell>
  );
}
