import { AppShell } from "@/features/i18n/AppShell";
import { DuasBrowser } from "@/features/duas/components/DuasBrowser";

export const dynamic = "force-dynamic";

export default function DuasPage() {
  return (
    <AppShell>
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-5 sm:gap-5 sm:py-8 md:px-6">
        <header className="space-y-1.5">
          <p className="text-muted text-xs tracking-[0.12em] uppercase">
            Companion · Memorize
          </p>
          <h1 className="text-primary text-2xl tracking-tight sm:text-3xl">
            Duas
          </h1>
          <p className="text-foreground/75 max-w-xl text-sm leading-relaxed">
            Qur’anic duas across juz 1–30 (dua text only), plus masnoon duas for
            daily moments. Mark each when you know it — progress appears on Home.
          </p>
        </header>
        <DuasBrowser />
      </main>
    </AppShell>
  );
}
