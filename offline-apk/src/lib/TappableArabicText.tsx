import type { ReactNode } from "react";
import { HighlightedText } from "./HighlightedText";
import { tokenMatchesSearch } from "./highlight";
import { isPunctuationToken } from "./meanings";

type Props = {
  arabic: string;
  query?: string;
  className?: string;
  onTokenClick: (token: string, el: HTMLElement) => void;
};

/** Split Arabic into tappable tokens (offline list screens). */
export function TappableArabicText({
  arabic,
  query = "",
  className,
  onTokenClick,
}: Props): ReactNode {
  return (
    <span className={className} dir="rtl" lang="ar">
      {arabic.split(/(\s+)/u).map((tok, i) => {
        if (!tok.trim()) return <span key={`s-${i}`}>{tok}</span>;
        if (isPunctuationToken(tok)) {
          return <span key={`p-${i}`}>{tok}</span>;
        }
        const marked = query.trim()
          ? tokenMatchesSearch(tok, query)
          : false;
        return (
          <button
            key={`w-${i}-${tok}`}
            type="button"
            data-tappable-ar="true"
            className={marked ? "match-word search-mark" : "match-word"}
            onClick={(e) => {
              e.stopPropagation();
              onTokenClick(tok, e.currentTarget);
            }}
          >
            {query.trim() ? (
              <HighlightedText text={tok} query={query} />
            ) : (
              tok
            )}
          </button>
        );
      })}
    </span>
  );
}
