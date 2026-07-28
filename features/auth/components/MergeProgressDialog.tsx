"use client";

import { useState, useTransition } from "react";

import {
  authHeaders,
  collectReadingSlice,
} from "@/features/auth/client/session-store";
import type { MigrationPreview } from "@/features/auth/types";

type Props = {
  open: boolean;
  onClose: () => void;
  onDone: (note: string) => void;
};

export function MergeProgressDialog({ open, onClose, onDone }: Props) {
  const [preview, setPreview] = useState<MigrationPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!open) return null;

  function loadPreview() {
    startTransition(async () => {
      setError(null);
      const response = await fetch("/api/v1/auth/migrate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({
          reading: collectReadingSlice(),
          confirm: false,
        }),
      });
      const data = (await response.json()) as {
        preview?: MigrationPreview;
        requiresConfirmation?: boolean;
        note?: string;
        error?: string;
        message?: string;
      };
      if (!response.ok) {
        setError(data.error ?? "پیش نظارہ ناکام");
        return;
      }
      if (data.preview) {
        setPreview(data.preview);
      }
      if (!data.requiresConfirmation && data.note) {
        onDone(data.note);
        onClose();
      }
    });
  }

  function apply(merge: boolean) {
    startTransition(async () => {
      setError(null);
      const response = await fetch("/api/v1/auth/migrate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({
          reading: collectReadingSlice(),
          merge,
          confirm: true,
          strategy: merge ? "merge" : "keep_remote",
        }),
      });
      const data = (await response.json()) as { note?: string; error?: string };
      if (!response.ok) {
        setError(data.error ?? "ضم ناکام");
        return;
      }
      onDone(data.note ?? "مکمل");
      onClose();
    });
  }

  return (
    <div
      className="bg-foreground/30 fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
      onClick={onClose}
      onKeyDown={(event) => {
        if (event.key === "Escape") onClose();
      }}
    >
      <div
        className="bg-surface max-w-md space-y-4 rounded-2xl p-6 shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="merge-dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="merge-dialog-title" className="text-primary text-2xl">
          پیش رفت ضم کریں؟
        </h2>
        <p className="text-sm leading-relaxed">
          مقامی مہمان ڈیٹا اور کلاؤڈ اکاؤنٹ دونوں پر پیش رفت ہو سکتی ہے۔ ضم کرنے
          سے پہلے انتخاب کریں — کچھ بھی خود بخود ضائع نہیں ہوگا جب تک آپ تصدیق
          نہ کریں۔
        </p>

        {!preview ? (
          <button
            type="button"
            className="bg-primary text-surface rounded-xl px-4 py-2"
            disabled={pending}
            onClick={loadPreview}
          >
            پیش نظارہ دیکھیں
          </button>
        ) : (
          <div className="text-muted space-y-1 text-sm">
            <p>مقامی ڈیٹا: {preview.hasLocalData ? "ہاں" : "نہیں"}</p>
            <p>کلاؤڈ ڈیٹا: {preview.hasCloudData ? "ہاں" : "نہیں"}</p>
          </div>
        )}

        {preview?.requiresUserChoice ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="bg-primary text-surface rounded-xl px-4 py-2"
              disabled={pending}
              onClick={() => apply(true)}
            >
              ضم کریں
            </button>
            <button
              type="button"
              className="border-border rounded-xl border px-4 py-2"
              disabled={pending}
              onClick={() => apply(false)}
            >
              صرف کلاؤڈ رکھیں
            </button>
          </div>
        ) : null}

        {error ? (
          <p className="text-warning text-sm" role="alert">
            {error}
          </p>
        ) : null}

        <button type="button" className="text-muted text-sm" onClick={onClose}>
          بعد میں
        </button>
      </div>
    </div>
  );
}
