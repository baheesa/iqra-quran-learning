"use client";

import { useEffect } from "react";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AppError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(
      JSON.stringify({
        level: "error",
        message: "ui_error_boundary",
        digest: error.digest ?? null,
        detail: error.message,
        service: "quran-learning-app",
        ts: new Date().toISOString(),
      }),
    );
  }, [error]);

  return (
    <main
      className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-4 px-4 text-center"
      role="alert"
    >
      <h1 className="text-primary text-2xl">Something went wrong</h1>
      <p className="text-muted text-sm">
        Sorry. Try reloading the page. Details are not shown here.
      </p>
      <button
        type="button"
        onClick={reset}
        className="border-border bg-surface rounded-xl border px-4 py-2 text-sm"
      >
        Try again
      </button>
    </main>
  );
}
