import type { ReactNode } from "react";
import { highlightSearchText } from "./highlight";

/** Renders text with the active search query highlighted (offline Iqra). */
export function HighlightedText({
  text,
  query,
  className,
}: {
  text: string;
  query: string;
  className?: string;
}): ReactNode {
  if (!query.trim() || !text) {
    return <span className={className}>{text}</span>;
  }
  return (
    <span className={className}>
      {highlightSearchText(text, query).map((part, i) =>
        part.hit ? (
          <mark key={i} className="search-mark">
            {part.text}
          </mark>
        ) : (
          <span key={i}>{part.text}</span>
        ),
      )}
    </span>
  );
}
