"use client";

import {
  VERIFIED_KNOWLEDGE_LABEL,
  buildVerifiedKnowledgeFields,
} from "@/features/knowledge/domain/verified-knowledge-view";
import type { KnowledgeLookupResult } from "@/features/knowledge/domain/vocabulary-lookup";

type Props = {
  result: KnowledgeLookupResult;
};

/**
 * Verified Muallim knowledge — meaning first; qaida only when present.
 */
export function VerifiedKnowledgeBlock({ result }: Props) {
  if (!result.found) {
    if (!result.message) {
      return (
        <p className="text-muted text-sm" aria-busy="true">
          علم تلاش ہو رہا ہے…
        </p>
      );
    }
    return (
      <p className="text-foreground/80 text-base leading-relaxed">
        {result.message}
      </p>
    );
  }

  const fields = buildVerifiedKnowledgeFields(result);
  const meaning = fields.find((item) => item.label === "معنی");
  const qaida = fields.find((item) => item.label === "قاعدہ");

  return (
    <div className="space-y-4">
      {meaning ? (
        <p className="font-urdu text-foreground text-2xl leading-relaxed">
          {meaning.value}
        </p>
      ) : null}

      {qaida ? (
        <div className="border-border/60 bg-background/40 rounded-xl border px-3 py-2.5">
          <p className="text-muted text-[0.7rem] tracking-wide">قاعدہ</p>
          <p className="text-foreground mt-1 text-base leading-relaxed">
            {qaida.value}
          </p>
        </div>
      ) : null}

      <p className="text-muted/80 text-[0.65rem]">{VERIFIED_KNOWLEDGE_LABEL}</p>
    </div>
  );
}
