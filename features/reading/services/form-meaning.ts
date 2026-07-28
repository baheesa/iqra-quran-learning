import {
  cleanMeaning,
  normalizeSearchForm,
  stripArabic,
} from "@/features/reading/lib/meanings";
import { getWordSearchIndex } from "@/features/reading/services/search-data";
import { loadWbwUrdu } from "@/features/reading/services/wbw-urdu";

/**
 * Strip neighbor-particle bleed that Quran.com WBW sometimes attaches
 * (e.g. جَاءَ at 4:43 → «یا آئے» because previous word is أو).
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

/**
 * When a tip has no ayah context, pick the most common cleaned WBW gloss
 * for that Arabic form (avoids first-hit traps like جاء → «یا آئے»).
 */
export async function lookupCanonicalFormMeaning(
  arabic: string,
): Promise<string | null> {
  const form = normalizeSearchForm(arabic);
  if (!form || form.length < 2) return null;

  const [index, wbw] = await Promise.all([
    getWordSearchIndex(),
    loadWbwUrdu(),
  ]);
  if (!wbw) return null;

  const hits = index[form] ?? [];
  if (!hits.length) return null;

  const counts = new Map<string, number>();
  for (const hit of hits.slice(0, 60)) {
    const raw = wbw.meanings[hit.w]?.trim();
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
      (count === bestCount &&
        best !== null &&
        gloss.length < best.length)
    ) {
      best = gloss;
      bestCount = count;
    }
  }
  return best;
}

/** Sync version for offline APK (WBW map already loaded). */
export function pickCanonicalFormMeaning(
  arabic: string,
  hits: Array<{ w: string }>,
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
      (count === bestCount &&
        best !== null &&
        gloss.length < best.length)
    ) {
      best = gloss;
      bestCount = count;
    }
  }
  return best;
}
