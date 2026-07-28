"use client";

type BookmarkButtonProps = {
  isBookmarked: boolean;
  onToggle: () => void;
};

export function BookmarkButton({
  isBookmarked,
  onToggle,
}: BookmarkButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={
        isBookmarked
          ? "bg-primary/10 text-primary border-primary/25 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border"
          : "border-border text-muted hover:text-primary hover:border-primary/30 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-surface transition-colors"
      }
      aria-pressed={isBookmarked}
      aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
      title={isBookmarked ? "Bookmarked" : "Bookmark"}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill={isBookmarked ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden
      >
        <path d="M6 4h12a1 1 0 011 1v16l-7-4-7 4V5a1 1 0 011-1z" />
      </svg>
    </button>
  );
}
