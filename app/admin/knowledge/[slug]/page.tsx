import Link from "next/link";

import { PublishActions } from "@/features/admin/components/PublishActions";
import { DevAutoApprovedBadge } from "@/features/knowledge/components/DevAutoApprovedBadge";
import { PageActions } from "@/features/knowledge/components/PageActions";
import { DEV_AUTO_APPROVER } from "@/features/knowledge/providers/auto-approve-enabled";
import { knowledgeEngine } from "@/features/knowledge/server";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
};

export default async function KnowledgeBookAdminPage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const pageNumber = Number(query.page ?? "1");
  const status = await knowledgeEngine.knowledgeBase.getBookStatus(slug);

  if (!status) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8">
        <p>Book not found: {slug}</p>
        <Link href="/admin/knowledge">Back</Link>
      </main>
    );
  }

  const ocr = await knowledgeEngine.repo.getOcrResult(slug, pageNumber);
  const extraction = await knowledgeEngine.repo.getExtraction(slug, pageNumber);
  const verifications = await knowledgeEngine.verification.list(slug);
  const pageVerification = verifications.find(
    (item) =>
      item.objectType === "PAGE" &&
      item.pageNumber === pageNumber &&
      item.status === "APPROVED",
  );
  const bookHasDevAuto = verifications.some(
    (item) =>
      item.status === "APPROVED" && item.approvedBy === DEV_AUTO_APPROVER,
  );
  const page = status.pages.find((item) => item.pageNumber === pageNumber);
  const imageSrc = page?.imageRelativePath
    ? `/api/v1/knowledge/page-image?bookSlug=${encodeURIComponent(slug)}&page=${pageNumber}`
    : null;

  const fromTxt = ocr?.provider === "txt-source";
  const ocrEnabled = knowledgeEngine.providers.ocrEnabled === true;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="text-muted text-sm">Knowledge Admin</p>
          <h1 className="text-primary text-2xl">{status.manifest.title}</h1>
          <p className="text-muted text-sm" dir="ltr">
            {slug} · source=
            {status.manifest.sourceKind ?? "unknown"} · imported{" "}
            {status.manifest.importedAt}
          </p>
          {bookHasDevAuto ? (
            <p className="mt-2">
              <DevAutoApprovedBadge approvedBy={DEV_AUTO_APPROVER} />
            </p>
          ) : null}
        </div>
        <div className="flex gap-3 text-sm">
          <Link href="/admin" className="text-muted">
            Dashboard
          </Link>
          <Link href="/admin/knowledge" className="text-muted">
            All books
          </Link>
        </div>
      </header>

      <section className="border-border bg-surface/80 mb-4 rounded-2xl border p-4">
        <h2 className="text-primary mb-2 text-lg">Book import</h2>
        <dl className="text-muted grid gap-1 text-sm" dir="ltr">
          <div>
            <dt className="inline">Source: </dt>
            <dd className="inline">
              {fromTxt || status.manifest.sourceKind === "txt"
                ? "Imported from TXT"
                : status.manifest.originalFileName}
            </dd>
          </div>
          <div>
            <dt className="inline">File: </dt>
            <dd className="inline">{status.manifest.originalFileName}</dd>
          </div>
          <div>
            <dt className="inline">Import date: </dt>
            <dd className="inline">{status.manifest.importedAt}</dd>
          </div>
          <div>
            <dt className="inline">Character count: </dt>
            <dd className="inline">
              {status.manifest.characterCount ?? "n/a"}
            </dd>
          </div>
          <div>
            <dt className="inline">Section count: </dt>
            <dd className="inline">
              {status.manifest.sectionCount ?? status.counts.pages}
            </dd>
          </div>
          <div>
            <dt className="inline">Extraction: </dt>
            <dd className="inline">
              {status.counts.extracted}/{status.counts.pages} · verification
              approved {status.counts.approved}
            </dd>
          </div>
        </dl>
      </section>

      <section className="border-border bg-surface/80 mb-4 rounded-2xl border p-4">
        <h2 className="text-primary mb-2 text-lg">Publication</h2>
        <PublishActions bookSlug={slug} />
      </section>

      <section className="mb-4 flex flex-wrap gap-2 text-sm">
        {status.pages.slice(0, 80).map((item) => (
          <Link
            key={item.pageNumber}
            href={`/admin/knowledge/${slug}?page=${item.pageNumber}`}
            className={`rounded-lg border px-2 py-1 ${
              item.pageNumber === pageNumber
                ? "border-primary bg-primary/10"
                : "border-border"
            }`}
          >
            {item.pageNumber}
          </Link>
        ))}
      </section>

      <section className="border-border bg-surface/80 mb-4 rounded-2xl border p-4">
        <h2 className="text-primary mb-2 text-lg">Section {pageNumber}</h2>
        <PageActions
          bookSlug={slug}
          pageNumber={pageNumber}
          ocrEnabled={ocrEnabled}
          sourceProvider={ocr?.provider}
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="border-border bg-surface/80 rounded-2xl border p-4">
          <h3 className="text-primary mb-2">Source text</h3>
          {fromTxt ? (
            <p className="text-muted mb-2 text-xs" dir="ltr">
              provider=txt-source · immutable original TXT
            </p>
          ) : null}
          <pre
            className="bg-background max-h-[70vh] overflow-auto rounded-xl p-3 text-xs whitespace-pre-wrap"
            dir="auto"
          >
            {ocr?.rawText || "(empty — run pnpm knowledge:import)"}
          </pre>
          <p className="text-muted mt-2 text-xs" dir="ltr">
            chars={ocr?.rawText?.length ?? 0} · review=
            {ocr?.reviewStatus ?? "n/a"} · provider={ocr?.provider ?? "n/a"}
          </p>
        </section>

        <section className="border-border bg-surface/80 rounded-2xl border p-4">
          <h3 className="text-primary mb-2">Page image (optional)</h3>
          {imageSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageSrc}
              alt={`Page ${pageNumber}`}
              className="border-border max-h-[70vh] w-full rounded-xl border object-contain"
            />
          ) : (
            <p className="text-muted text-sm">
              No PDF page image (normal for TXT primary workflow). Future OCR
              Import can attach PNGs when enabled.
            </p>
          )}
        </section>
      </div>

      <section className="border-border bg-surface/80 mt-4 rounded-2xl border p-4">
        <h3 className="text-primary mb-2">Extracted JSON</h3>
        <pre
          className="bg-background max-h-[50vh] overflow-auto rounded-xl p-3 text-xs"
          dir="ltr"
        >
          {extraction
            ? JSON.stringify(extraction, null, 2)
            : "(no extraction)"}
        </pre>
        <p className="text-muted mt-2 text-xs" dir="ltr">
          verification={extraction?.verificationStatus ?? "n/a"} · confidence=
          {extraction?.confidence ?? "n/a"}
        </p>
        {pageVerification?.approvedBy === DEV_AUTO_APPROVER ? (
          <p className="mt-2">
            <DevAutoApprovedBadge approvedBy={pageVerification.approvedBy} />
            <span className="text-muted ml-2 text-xs" dir="ltr">
              by={pageVerification.approvedBy} · at=
              {pageVerification.approvedAt} · {pageVerification.approvalReason}
            </span>
          </p>
        ) : null}
      </section>
    </main>
  );
}
