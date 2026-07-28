"use client";

import { useEffect, useState } from "react";

import { VerifiedKnowledgeBlock } from "@/features/knowledge/components/VerifiedKnowledgeBlock";
import type { KnowledgeLookupResult } from "@/features/knowledge/domain/vocabulary-lookup";
import { UNKNOWN_WORD_MESSAGE } from "@/features/knowledge/domain/vocabulary-lookup";
import type { SelectedWordInfo } from "@/types/quran";

type WordInfoPanelProps = {
  word: SelectedWordInfo | null;
  onClose: () => void;
};

/**
 * Recognition-first word panel: verified Muallim knowledge only.
 * Calm meaning-first surface — no surah/ayah/page/juz chrome.
 */
export function WordInfoPanel({ word, onClose }: WordInfoPanelProps) {
  const [lookup, setLookup] = useState<KnowledgeLookupResult | null>(null);

  useEffect(() => {
    if (!word) {
      setLookup(null);
      return;
    }

    setLookup({
      found: false,
      word: word.arabic,
      meaning: null,
      arabic: word.arabic,
      root: null,
      lesson: null,
      unit: null,
      grammar: null,
      rule: null,
      explanation: null,
      references: [],
      difficulty: null,
      occurrences: null,
      page: null,
      bookSlug: null,
      vocabularyId: null,
      source: null,
      message: null,
    });

    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch(
          `/api/v1/knowledge/lookup?word=${encodeURIComponent(word.arabic)}`,
        );
        if (!response.ok) return;
        const payload = (await response.json()) as {
          success?: boolean;
          data?: KnowledgeLookupResult;
        };
        if (!cancelled && payload.data) {
          setLookup(payload.data);
        }
      } catch {
        if (!cancelled) {
          setLookup({
            found: false,
            word: word.arabic,
            meaning: null,
            arabic: word.arabic,
            root: null,
            lesson: null,
            unit: null,
            grammar: null,
            rule: null,
            explanation: null,
            references: [],
            difficulty: null,
            occurrences: null,
            page: null,
            bookSlug: null,
            vocabularyId: null,
            source: null,
            message: UNKNOWN_WORD_MESSAGE,
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [word]);

  if (!word) {
    return null;
  }

  return (
    <aside
      className="border-border/50 from-surface via-surface to-primary/[0.04] relative overflow-hidden rounded-3xl border bg-gradient-to-b p-5 shadow-[0_12px_40px_-18px_rgba(0,0,0,0.35)]"
      aria-live="polite"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(ellipse_at_top,color-mix(in_srgb,var(--primary)_14%,transparent),transparent_70%)]"
        aria-hidden
      />

      <div className="relative mb-4 flex items-start justify-between gap-3">
        <p className="font-quran text-primary text-[2.35rem] leading-[1.55]">
          {word.arabic}
        </p>
        <button
          type="button"
          className="text-muted hover:text-foreground hover:bg-background/60 shrink-0 rounded-full px-2.5 py-1 text-sm transition-colors"
          onClick={onClose}
        >
          بند کریں
        </button>
      </div>

      <div className="relative">
        {lookup ? (
          <VerifiedKnowledgeBlock result={lookup} />
        ) : (
          <p className="text-muted text-sm">علم تلاش ہو رہا ہے…</p>
        )}
      </div>
    </aside>
  );
}
