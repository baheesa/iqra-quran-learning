import Link from "next/link";

import { getAdminEngine } from "@/features/admin/server";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const stats = await getAdminEngine().admin.dashboard();

  return (
    <main className="mx-auto max-w-5xl px-4 py-8" dir="rtl">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-muted text-sm">منتظم</p>
          <h1 className="text-primary text-3xl">علمی بنیاد — ڈیش بورڈ</h1>
          <p className="text-muted mt-1 text-sm">
            صرف تصدیق شدہ علم شائع ہوتا ہے۔ مسودے متعلمین کو نہیں دکھتے۔
          </p>
        </div>
        <nav className="flex flex-wrap gap-3 text-sm">
          <Link href="/admin/knowledge" className="text-primary">
            کتب
          </Link>
          <Link href="/admin/search" className="text-primary">
            تلاش
          </Link>
          <Link href="/admin/audit" className="text-primary">
            آڈٹ
          </Link>
          <Link href="/admin/roles" className="text-primary">
            کردار
          </Link>
          <Link href="/" className="text-muted">
            صفحہ اول
          </Link>
        </nav>
      </header>

      <section className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="کتب" value={String(stats.books)} />
        <Stat label="صفحات" value={String(stats.pagesProcessed)} />
        <Stat
          label="OCR"
          value={`${stats.ocrProgress.done}/${stats.ocrProgress.total}`}
        />
        <Stat
          label="استخراج"
          value={`${stats.extractionProgress.done}/${stats.extractionProgress.total}`}
        />
        <Stat
          label="منظور شدہ"
          value={String(stats.verificationProgress.approved)}
        />
        <Stat label="زیرِ نظر" value={String(stats.pendingReviews)} />
        <Stat label="شائع شدہ" value={String(stats.publishedKnowledge)} />
        <Stat
          label="توثیق"
          value={
            stats.validationStatus.lastOk === null
              ? "—"
              : stats.validationStatus.lastOk
                ? "درست"
                : `${stats.validationStatus.openErrors} غلطیاں`
          }
        />
      </section>

      <section className="border-border bg-surface/80 rounded-2xl border p-4">
        <h2 className="text-primary mb-3 text-lg">حالیہ سرگرمی</h2>
        {stats.recentActivity.length === 0 ? (
          <p className="text-muted text-sm">ابھی کوئی آڈٹ ریکارڈ نہیں۔</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {stats.recentActivity.map((entry) => (
              <li
                key={entry.id}
                className="border-border flex flex-wrap justify-between gap-2 rounded-xl border px-3 py-2"
              >
                <span>
                  {entry.action}
                  {entry.bookSlug ? ` · ${entry.bookSlug}` : ""}
                </span>
                <span className="text-muted" dir="ltr">
                  {entry.actorEmail ?? "system"} ·{" "}
                  {new Date(entry.createdAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-border bg-surface/80 rounded-2xl border px-4 py-3">
      <p className="text-muted text-xs">{label}</p>
      <p className="text-primary mt-1 text-xl" dir="ltr">
        {value}
      </p>
    </div>
  );
}
