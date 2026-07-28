"use client";

type ReadingProgressProps = {
  page: number;
  juz: number;
  surahName: string;
};

export function ReadingProgress({
  page,
  juz,
  surahName,
}: ReadingProgressProps) {
  return (
    <div className="border-border bg-surface/70 text-muted rounded-xl border px-4 py-3 text-sm">
      <p>
        موجودہ مقام: پارہ {juz} · {surahName} · صفحہ {page}
      </p>
    </div>
  );
}
