import {
  cleanMeaning,
  normalizeSearchForm,
  stripArabic,
} from "./meanings";
import type { SearchHit } from "./quran-search";

/**
 * Strip neighbor-particle bleed (e.g. جاء → «یا آئے» from أو + جاء).
 */
export function stripStandaloneParticleBleed(
  arabic: string,
  urdu: string,
): string {
  let meaning = cleanMeaning(urdu);
  const form = stripArabic(arabic);
  if (!form || form === "يا" || form === "و" || form === "ف") {
    return meaning;
  }
  meaning = meaning.replace(/^(یا|اور|پس)\s+/u, "").trim();
  return meaning;
}

/** Most common cleaned gloss for a form (offline / no ayah ref). */
export function pickCanonicalFormMeaning(
  arabic: string,
  hits: SearchHit[],
  meanings: Record<string, string>,
): string | null {
  if (!hits.length) return null;
  const counts = new Map<string, number>();
  for (const hit of hits.slice(0, 60)) {
    const raw = meanings[hit.w]?.trim();
    if (!raw) continue;
    const gloss = stripStandaloneParticleBleed(arabic, raw);
    if (!gloss) continue;
    counts.set(gloss, (counts.get(gloss) ?? 0) + 1);
  }
  let best: string | null = null;
  let bestCount = 0;
  for (const [gloss, count] of counts) {
    if (
      count > bestCount ||
      (count === bestCount && best !== null && gloss.length < best.length)
    ) {
      best = gloss;
      bestCount = count;
    }
  }
  return best;
}

export function exactHitsForToken(
  arabicToken: string,
  index: Record<string, SearchHit[]>,
): SearchHit[] {
  const form = normalizeSearchForm(arabicToken);
  if (!form || form.length < 2) return [];
  return index[form] ?? [];
}
