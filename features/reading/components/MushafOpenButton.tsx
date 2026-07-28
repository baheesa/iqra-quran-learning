import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  page: number;
  className?: string;
  title?: string;
};

function BookGlyph({ size = 16 }: { size?: number }): ReactNode {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </svg>
  );
}

/** Icon-only link to open a mushaf page (replaces "Open mushaf" text). */
export function MushafOpenButton({
  page,
  className,
  title = "Open mushaf",
}: Props) {
  return (
    <Link
      href={`/quran?page=${page}`}
      title={title}
      aria-label={title}
      className={
        className ??
        "border-border text-primary hover:bg-primary/10 inline-grid h-8 w-8 shrink-0 place-items-center rounded-lg border"
      }
    >
      <BookGlyph />
    </Link>
  );
}
