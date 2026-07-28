"use client";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="en" dir="ltr">
      <body className="font-ui antialiased">
        <main
          className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 px-4 text-center"
          role="alert"
        >
          <h1 className="text-2xl">Something went wrong</h1>
          <p className="text-sm opacity-70">
            Please refresh the page.
            {error.digest ? ` (ref: ${error.digest})` : ""}
          </p>
          <button
            type="button"
            onClick={reset}
            className="rounded-xl border px-4 py-2 text-sm"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
