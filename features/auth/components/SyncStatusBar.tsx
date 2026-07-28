"use client";

import { useCallback, useEffect, useState, useTransition } from "react";

import {
  authHeaders,
  collectReadingSlice,
  loadClientSession,
} from "@/features/auth/client/session-store";
import type { SyncStatus } from "@/features/auth/types";

export function SyncStatusBar() {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const refresh = useCallback(() => {
    startTransition(async () => {
      const online = typeof navigator === "undefined" ? true : navigator.onLine;
      const response = await fetch("/api/v1/auth/sync", {
        headers: {
          ...authHeaders(),
          "x-online": online ? "1" : "0",
        },
      });
      if (!response.ok) return;
      const data = (await response.json()) as { status: SyncStatus };
      setStatus(data.status);
    });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function syncNow() {
    const session = loadClientSession();
    if (!session) {
      setNote("ہم آہنگی کے لیے سائن ان کریں");
      return;
    }
    startTransition(async () => {
      const response = await fetch("/api/v1/auth/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({
          reading: collectReadingSlice(),
          online: navigator.onLine,
        }),
      });
      const data = (await response.json()) as {
        note?: string;
        error?: string;
        status?: SyncStatus;
      };
      setNote(data.error ?? data.note ?? null);
      if (data.status) setStatus(data.status);
      refresh();
    });
  }

  return (
    <div className="border-border bg-surface/70 space-y-2 rounded-2xl border p-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted">
          {status?.guest ? "مہمان موڈ" : status?.online ? "آن لائن" : "آف لائن"}
          {status?.lastSyncedAt
            ? ` · آخری ہم آہنگی ${new Date(status.lastSyncedAt).toLocaleString("ur-PK")}`
            : ""}
          {status && status.pendingOps > 0
            ? ` · انتظار میں ${status.pendingOps}`
            : ""}
        </p>
        <button
          type="button"
          className="border-border rounded-xl border px-3 py-1 disabled:opacity-50"
          disabled={pending}
          onClick={syncNow}
        >
          اب ہم آہنگ کریں
        </button>
      </div>
      {note ? <p className="text-muted">{note}</p> : null}
    </div>
  );
}
