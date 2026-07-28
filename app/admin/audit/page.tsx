"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { authHeaders } from "@/features/auth/client/session-store";
import type { AuditLogRecord } from "@/features/admin/types";

export default function AdminAuditPage() {
  const [entries, setEntries] = useState<AuditLogRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch("/api/v1/admin/audit?limit=100", {
          headers: { ...authHeaders() },
        });
        const payload = (await response.json()) as {
          success: boolean;
          data?: AuditLogRecord[];
          error?: { message: string };
        };
        if (!response.ok || !payload.success) {
          throw new Error(payload.error?.message ?? "Failed");
        }
        setEntries(payload.data ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error");
      }
    })();
  }, []);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8" dir="rtl">
      <header className="mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="text-muted text-sm">منتظم</p>
          <h1 className="text-primary text-2xl">آڈٹ لاگ</h1>
        </div>
        <Link href="/admin" className="text-muted text-sm">
          ڈیش بورڈ
        </Link>
      </header>

      {error ? <p className="text-muted text-sm">{error}</p> : null}

      <ul className="space-y-2 text-sm">
        {entries.map((entry) => (
          <li
            key={entry.id}
            className="border-border rounded-xl border px-3 py-3"
          >
            <p className="font-medium">{entry.action}</p>
            <p className="text-muted" dir="ltr">
              {entry.bookSlug ?? "—"} · {entry.actorEmail ?? "system"} ·{" "}
              {new Date(entry.createdAt).toLocaleString()}
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
