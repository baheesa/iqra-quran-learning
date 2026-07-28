"use client";

import Link from "next/link";
import { useState } from "react";

import { authHeaders } from "@/features/auth/client/session-store";
import type { KnowledgeSearchHit } from "@/features/admin/types";
import { HighlightedText } from "@/features/reading/components/HighlightedText";

export default function AdminSearchPage() {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<KnowledgeSearchHit[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function runSearch(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/v1/admin/search?q=${encodeURIComponent(query)}`,
        { headers: { ...authHeaders() } },
      );
      const payload = (await response.json()) as {
        success: boolean;
        data?: KnowledgeSearchHit[];
        error?: { message: string };
      };
      if (!response.ok || !payload.success) {
        throw new Error(payload.error?.message ?? "Search failed");
      }
      setHits(payload.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
      setHits([]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8" dir="rtl">
      <header className="mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="text-muted text-sm">منتظم</p>
          <h1 className="text-primary text-2xl">علم تلاش</h1>
        </div>
        <Link href="/admin" className="text-muted text-sm">
          ڈیش بورڈ
        </Link>
      </header>

      <form onSubmit={(event) => void runSearch(event)} className="mb-6 flex gap-2">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="border-border bg-surface flex-1 rounded-xl border px-3 py-2 text-sm"
          placeholder="یونٹ، سبق، قاعدہ، الفاظ، صفحہ…"
        />
        <button
          type="submit"
          disabled={busy}
          className="border-border bg-surface rounded-xl border px-4 py-2 text-sm disabled:opacity-40"
        >
          تلاش
        </button>
      </form>

      {error ? <p className="text-muted mb-4 text-sm">{error}</p> : null}

      <ul className="space-y-2 text-sm">
        {hits.map((hit) => (
          <li
            key={`${hit.kind}-${hit.objectId}-${hit.pageNumber}`}
            className="border-border rounded-xl border px-3 py-3"
          >
            <p className="text-foreground font-medium">
              <HighlightedText text={hit.title} query={query} />{" "}
              <span className="text-muted text-xs" dir="ltr">
                ({hit.kind})
              </span>
            </p>
            <p className="text-muted">
              <HighlightedText text={hit.snippet} query={query} />
            </p>
            <Link
              href={`/admin/knowledge/${hit.bookSlug}${
                hit.pageNumber ? `?page=${hit.pageNumber}` : ""
              }`}
              className="text-primary mt-1 inline-block"
              dir="ltr"
            >
              {hit.bookSlug}
              {hit.pageNumber ? ` · p${hit.pageNumber}` : ""}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
