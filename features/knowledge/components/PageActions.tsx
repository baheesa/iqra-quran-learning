"use client";

import { useState } from "react";

import { authHeaders } from "@/features/auth/client/session-store";

type PageActionsProps = {
  bookSlug: string;
  pageNumber: number;
  /** When false, Vision OCR actions stay in a collapsed Future OCR section. */
  ocrEnabled?: boolean;
  sourceProvider?: string | null;
};

export function PageActions({
  bookSlug,
  pageNumber,
  ocrEnabled = false,
  sourceProvider,
}: PageActionsProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function post(url: string, body?: Record<string, unknown>) {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({ bookSlug, pageNumber, ...body }),
      });
      const payload = (await response.json()) as {
        success: boolean;
        message?: string;
        error?: { message: string };
      };
      if (!response.ok || !payload.success) {
        throw new Error(payload.error?.message ?? "Request failed");
      }
      setMessage(payload.message ?? "Done");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  async function patchOcr(status: "ACCEPTED" | "NEEDS_REVIEW") {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/v1/admin/ocr", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({ bookSlug, pageNumber, status }),
      });
      const payload = (await response.json()) as {
        success: boolean;
        message?: string;
        error?: { message: string };
      };
      if (!response.ok || !payload.success) {
        throw new Error(payload.error?.message ?? "Request failed");
      }
      setMessage(payload.message ?? "Source text review updated");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  const fromTxt = sourceProvider === "txt-source";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={busy}
          className="border-border bg-surface rounded-xl border px-3 py-1.5 text-sm disabled:opacity-40"
          onClick={() => void post("/api/v1/knowledge/approve")}
        >
          Approve
        </button>
        <button
          type="button"
          disabled={busy}
          className="border-border bg-surface rounded-xl border px-3 py-1.5 text-sm disabled:opacity-40"
          onClick={() =>
            void post("/api/v1/knowledge/reject", { note: "Rejected in admin" })
          }
        >
          Reject
        </button>
        <button
          type="button"
          disabled={busy}
          className="border-border bg-surface rounded-xl border px-3 py-1.5 text-sm disabled:opacity-40"
          onClick={() => void post("/api/v1/admin/extraction")}
        >
          Extract
        </button>
        <button
          type="button"
          disabled={busy}
          className="border-border bg-surface rounded-xl border px-3 py-1.5 text-sm disabled:opacity-40"
          onClick={() =>
            void post("/api/v1/admin/reprocess", { stages: ["extraction"] })
          }
        >
          Re-extract
        </button>
        {fromTxt ? (
          <span className="text-muted text-sm" dir="ltr">
            Imported from TXT
          </span>
        ) : null}
        {message ? <span className="text-muted text-sm">{message}</span> : null}
      </div>

      <details className="border-border rounded-xl border px-3 py-2 text-sm">
        <summary className="text-muted cursor-pointer select-none">
          Future OCR Import
        </summary>
        <p className="text-muted mt-2 text-xs leading-relaxed">
          Vision OCR / PDF raster are optional and disabled in the normal
          workflow. Enable only with <code dir="ltr">OCR_ENABLED=1</code>.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy || !ocrEnabled}
            className="border-border bg-surface rounded-xl border px-3 py-1.5 text-sm disabled:opacity-40"
            onClick={() => void post("/api/v1/admin/ocr")}
          >
            Run OCR
          </button>
          <button
            type="button"
            disabled={busy}
            className="border-border bg-surface rounded-xl border px-3 py-1.5 text-sm disabled:opacity-40"
            onClick={() => void patchOcr("ACCEPTED")}
          >
            Accept source text
          </button>
          <button
            type="button"
            disabled={busy}
            className="border-border bg-surface rounded-xl border px-3 py-1.5 text-sm disabled:opacity-40"
            onClick={() => void patchOcr("NEEDS_REVIEW")}
          >
            Source needs review
          </button>
        </div>
      </details>
    </div>
  );
}
