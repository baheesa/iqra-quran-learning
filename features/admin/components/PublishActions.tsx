"use client";

import { useState } from "react";

import { authHeaders } from "@/features/auth/client/session-store";

type PublishActionsProps = {
  bookSlug: string;
};

export function PublishActions({ bookSlug }: PublishActionsProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function post(path: string, body: Record<string, unknown>) {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(path, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify(body),
      });
      const payload = (await response.json()) as {
        success: boolean;
        message?: string;
        error?: { message: string };
      };
      if (!response.ok && response.status !== 422) {
        throw new Error(payload.error?.message ?? "Request failed");
      }
      setMessage(payload.message ?? "Done");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={busy}
        className="border-border bg-surface rounded-xl border px-3 py-1.5 text-sm disabled:opacity-40"
        onClick={() => void post("/api/v1/admin/validation", { bookSlug })}
      >
        Validate
      </button>
      <button
        type="button"
        disabled={busy}
        className="border-border bg-surface rounded-xl border px-3 py-1.5 text-sm disabled:opacity-40"
        onClick={() => void post("/api/v1/admin/publication", { bookSlug })}
      >
        Publish
      </button>
      <button
        type="button"
        disabled={busy}
        className="border-border bg-surface rounded-xl border px-3 py-1.5 text-sm disabled:opacity-40"
        onClick={() =>
          void post("/api/v1/admin/books", {
            action: "archive",
            bookSlug,
          })
        }
      >
        Archive
      </button>
      <button
        type="button"
        disabled={busy}
        className="border-border bg-surface rounded-xl border px-3 py-1.5 text-sm disabled:opacity-40"
        onClick={() =>
          void post("/api/v1/admin/books", {
            action: "version",
            bookSlug,
          })
        }
      >
        Version
      </button>
      {message ? <span className="text-muted text-sm">{message}</span> : null}
    </div>
  );
}
