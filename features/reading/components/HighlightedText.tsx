"use client";

import { highlightSearchText } from "@/features/reading/lib/highlight";

type Props = {
  text: string;
  query: string;
  className?: string;
  markClassName?: string;
};

/** Renders text with the active search query highlighted. */
export function HighlightedText({
  text,
  query,
  className,
  markClassName = "bg-amber-300/55 rounded px-0.5 dark:bg-amber-500/35",
}: Props) {
  if (!query.trim() || !text) {
    return <span className={className}>{text}</span>;
  }
  return (
    <span className={className}>
      {highlightSearchText(text, query).map((part, i) =>
        part.hit ? (
          <mark key={i} className={markClassName}>
            {part.text}
          </mark>
        ) : (
          <span key={i}>{part.text}</span>
        ),
      )}
    </span>
  );
}
