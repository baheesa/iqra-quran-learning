import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-primary text-2xl">Page not found</h1>
      <p className="text-muted text-sm">
        The page you requested does not exist or has moved.
      </p>
      <Link
        href="/"
        className="border-border bg-surface rounded-xl border px-4 py-2 text-sm"
      >
        Home
      </Link>
    </main>
  );
}
