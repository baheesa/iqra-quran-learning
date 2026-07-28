import Link from "next/link";

import { knowledgeEngine } from "@/features/knowledge/server";

export const dynamic = "force-dynamic";

export default async function KnowledgeAdminPage() {
  const [discovered, overview] = await Promise.all([
    knowledgeEngine.books.discover(),
    knowledgeEngine.knowledgeBase.listBooksOverview(),
  ]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <header className="mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="text-muted text-sm">داخلی آلات</p>
          <h1 className="text-primary text-2xl">علمی بنیاد — کتب</h1>
          <p className="text-muted mt-1 text-sm">
            بنیادی ماخذ: دستی TXT فائلیں (
            <span dir="ltr">knowledge/books/original/</span>)
          </p>
        </div>
        <nav className="flex gap-3 text-sm">
          <Link href="/admin" className="text-primary">
            ڈیش بورڈ
          </Link>
          <Link href="/admin/search" className="text-primary">
            تلاش
          </Link>
          <Link href="/" className="text-muted">
            صفحہ اول
          </Link>
        </nav>
      </header>

      <section className="border-border bg-surface/80 mb-8 rounded-2xl border p-4">
        <h2 className="text-primary mb-3 text-lg">اصلی TXT / کتابیں</h2>
        <ul className="space-y-2 text-sm">
          {discovered.map((book) => (
            <li
              key={book.fileName}
              className="border-border flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2"
            >
              <span>
                {book.title}
                {book.unitNumber ? ` (Unit ${book.unitNumber})` : ""}
                <span className="text-muted ms-2" dir="ltr">
                  [{book.sourceKind}]
                </span>
              </span>
              <span className="text-muted" dir="ltr">
                {(book.sizeBytes / 1024).toFixed(0)} KB
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-border bg-surface/80 rounded-2xl border p-4">
        <h2 className="text-primary mb-3 text-lg">رجسٹرڈ کتب / حیثیت</h2>
        {overview.length === 0 ? (
          <p className="text-muted text-sm">
            ابھی کوئی کتاب رجسٹر نہیں۔{" "}
            <code dir="ltr">pnpm knowledge:import</code> چلائیں۔
          </p>
        ) : (
          <ul className="space-y-3 text-sm">
            {overview.map((book) => (
              <li
                key={book.slug}
                className="border-border rounded-xl border px-3 py-3"
              >
                <p className="text-foreground font-medium">{book.title}</p>
                <p className="text-muted" dir="ltr">
                  status={book.pipelineStatus} · sections=
                  {book.pageCount ?? book.counts?.pages ?? 0} · sourceText=
                  {book.counts?.ocr ?? 0} · extracted=
                  {book.counts?.extracted ?? 0} · approved=
                  {book.counts?.approved ?? 0}
                </p>
                <Link
                  href={`/admin/knowledge/${book.slug}`}
                  className="text-primary mt-1 inline-block"
                  dir="ltr"
                >
                  Open review UI
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
