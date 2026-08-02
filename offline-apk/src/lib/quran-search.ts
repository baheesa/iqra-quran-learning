/** Quran word / phrase / Urdu search helpers for Iqra. */

import { normalizeSearchForm, searchFormVariants } from "./meanings";

export type SearchHit = { p: number; a: string; w: string; ar: string };

export type AyahCard = {
  p: number;
  ar: string;
  ur: string;
};

export type MatchItem = {
  ayahId: string;
  page: number;
  arabic: string;
  urdu: string;
  matchedArabic?: string;
  matchedWordId?: string;
};

function wordPos(wordId: string): number {
  const parts = wordId.split(":");
  const n = Number(parts[2]);
  return Number.isFinite(n) ? n : 0;
}

function pushUniqueHits(
  into: SearchHit[],
  hits: SearchHit[],
  limit: number,
  seen: Set<string>,
): boolean {
  for (const h of hits) {
    const key = `${h.a}:${h.w}`;
    if (seen.has(key)) continue;
    seen.add(key);
    into.push(h);
    if (into.length >= limit) return true;
  }
  return false;
}

function lookupToken(
  token: string,
  index: Record<string, SearchHit[]>,
  limit = 80,
): SearchHit[] {
  if (!token) return [];
  const variants = searchFormVariants(token);
  const seen = new Set<string>();
  const exactHits: SearchHit[] = [];

  for (const form of variants) {
    const exact = index[form] ?? [];
    if (pushUniqueHits(exactHits, exact, limit, seen)) return exactHits;
  }
  if (exactHits.length) return exactHits;

  // Avoid full-index scans for very short tokens (too many false hits / lag).
  if (variants.every((v) => v.length < 2)) return [];

  const prefix: SearchHit[] = [];
  const contains: SearchHit[] = [];
  const prefixSeen = new Set<string>();
  const containsSeen = new Set<string>();

  for (const [form, hits] of Object.entries(index)) {
    let matchedPrefix = false;
    for (const v of variants) {
      if (v.length >= 2 && form.startsWith(v)) {
        matchedPrefix = true;
        break;
      }
    }
    if (matchedPrefix) {
      if (pushUniqueHits(prefix, hits, limit, prefixSeen)) return prefix;
      continue;
    }
    for (const v of variants) {
      if (v.length >= 3 && form.includes(v)) {
        if (
          pushUniqueHits(
            contains,
            hits,
            Math.max(0, limit - prefix.length),
            containsSeen,
          )
        ) {
          return [...prefix, ...contains].slice(0, limit);
        }
        break;
      }
    }
  }
  return [...prefix, ...contains].slice(0, limit);
}

/** Resolve a visible Arabic token to an indexed hit inside one ayah. */
export function findHitInAyah(
  arabicToken: string,
  ayahId: string,
  index: Record<string, SearchHit[]>,
): SearchHit | null {
  for (const form of searchFormVariants(arabicToken)) {
    const exact = index[form];
    if (exact) {
      const hit = exact.find((h) => h.a === ayahId);
      if (hit) return hit;
    }
  }
  for (const form of searchFormVariants(arabicToken)) {
    for (const h of lookupToken(form, index, 40)) {
      if (h.a === ayahId) return h;
    }
  }
  return null;
}

/** Expand refs like "12:6" or "1:5-7" into ayah ids. */
export function expandAyahRefs(ref: string | null | undefined): string[] {
  if (!ref?.trim()) return [];
  const r = ref.trim();
  if (/^\d+:\d+$/.test(r)) return [r];
  const range = r.match(/^(\d+):(\d+)\s*[-–—]\s*(\d+)$/);
  if (range) {
    const surah = range[1]!;
    const from = Number(range[2]);
    const to = Number(range[3]);
    if (!Number.isFinite(from) || !Number.isFinite(to) || to < from) return [r];
    const out: string[] = [];
    for (let a = from; a <= to; a += 1) out.push(`${surah}:${a}`);
    return out;
  }
  return [r];
}

/**
 * Resolve a display token to a WBW word hit using an optional ayah ref
 * (single or range).
 *
 * Without a ref (e.g. qawaid examples): exact form only — never prefix/partial
 * matches, and never trust "first Quran hit" alone (that caused جاء → «یا آئے»).
 * Returns a carrier hit when the form exists so the tip API can run form
 * consensus via standalone=1.
 */
export function findHitForArabicToken(
  arabicToken: string,
  ref: string | null | undefined,
  index: Record<string, SearchHit[]>,
): SearchHit | null {
  for (const ayahId of expandAyahRefs(ref)) {
    const hit = findHitInAyah(arabicToken, ayahId, index);
    if (hit) return hit;
  }
  const form = normalizeSearchForm(arabicToken);
  if (!form || form.length < 2) return null;
  for (const variant of searchFormVariants(arabicToken)) {
    const exact = index[variant];
    if (exact?.length) return exact[0]!;
  }
  // Unscoped tips must not invent via partial forms.
  return null;
}

/**
 * Autocomplete forms from the word index (normalized, diacritic-free).
 * For multi-word queries, suggestions follow the last typed token.
 */
export function suggestSearchForms(
  query: string,
  index: Record<string, SearchHit[]>,
  limit = 8,
): string[] {
  const parts = query
    .trim()
    .split(/[\s\u0640]+/u)
    .map((p) => p.trim())
    .filter(Boolean);
  const last = parts[parts.length - 1] ?? "";
  const variants = searchFormVariants(last);
  const t = variants[0] ?? "";
  if (t.length < 1) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (form: string) => {
    if (seen.has(form)) return;
    seen.add(form);
    out.push(form);
  };
  for (const v of variants) {
    if (index[v]?.length) push(v);
  }
  if (out.length >= limit) return out;
  for (const form of Object.keys(index)) {
    if (variants.some((v) => v.length >= 1 && form.startsWith(v)) && !seen.has(form)) {
      push(form);
    }
    if (out.length >= limit) return out;
  }
  if (t.length >= 2) {
    for (const form of Object.keys(index)) {
      if (
        !seen.has(form) &&
        variants.some((v) => v.length >= 2 && form.includes(v) && !form.startsWith(v))
      ) {
        push(form);
      }
      if (out.length >= limit) return out;
    }
  }
  return out;
}

function nextTokenInAyah(
  token: string,
  ayahId: string,
  afterPos: number,
  index: Record<string, SearchHit[]>,
): SearchHit | null {
  const candidates = lookupToken(token, index, 120);
  let best: SearchHit | null = null;
  for (const h of candidates) {
    if (h.a !== ayahId) continue;
    const pos = wordPos(h.w);
    if (pos <= afterPos) continue;
    if (!best || wordPos(best.w) > pos) best = h;
  }
  return best;
}

/**
 * Search one or more Arabic words. Multi-word queries match consecutive
 * tokens in the same ayah (punctuation gaps allowed via word id order).
 */
export function searchQuranWords(
  query: string,
  index: Record<string, SearchHit[]>,
  limit = 30,
): SearchHit[] {
  const rawParts = query
    .trim()
    .split(/[\s\u0640]+/u)
    .map((p) => p.trim())
    .filter(Boolean);
  const tokens = rawParts
    .map((p) => searchFormVariants(p)[0] ?? "")
    .filter((t) => t.length >= 1);
  if (tokens.length === 0) return [];

  if (tokens.length === 1) {
    const key = tokens[0]!;
    if (key.length < 2 && searchFormVariants(rawParts[0]!).every((v) => v.length < 2)) {
      return [];
    }
    return lookupToken(rawParts[0]!, index, limit);
  }

  const first = lookupToken(rawParts[0]!, index, 500);
  const out: SearchHit[] = [];
  const seen = new Set<string>();
  // Allow a wider gap so short particles / punctuation between phrase words still match.
  const maxGap = Math.max(8, tokens.length * 4);

  for (const start of first) {
    let cursor = start;
    let ok = true;
    for (let i = 1; i < tokens.length; i += 1) {
      const nxt = nextTokenInAyah(
        rawParts[i]!,
        start.a,
        wordPos(cursor.w),
        index,
      );
      if (!nxt) {
        ok = false;
        break;
      }
      if (wordPos(nxt.w) - wordPos(cursor.w) > maxGap) {
        ok = false;
        break;
      }
      cursor = nxt;
    }
    if (!ok) continue;
    const key = `${start.a}:${start.w}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(start);
    if (out.length >= limit) break;
  }

  return out;
}

/** Normalize Urdu/Arabic script for loose contains search. */
export function normalizeUrduQuery(text: string): string {
  return text
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/gu, "")
    .replace(/\u0671/gu, "ا")
    .replace(/[آأإ]/gu, "ا")
    .replace(/ى/gu, "ي")
    .replace(/ة/gu, "ه")
    .replace(/[يئ]/gu, "ی")
    .replace(/ک/gu, "ك")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * True when the query looks like Quranic Arabic (has tashkeel / hamza forms),
 * not only plain Urdu letters.
 */
export function looksLikeArabicQuranQuery(query: string): boolean {
  const q = query.trim();
  if (!q) return false;
  if (/[\u064B-\u065F\u0670\u06D6-\u06EDٱ]/.test(q)) return true;
  // Mostly Arabic letters without Urdu-specific ی/ے/گ/پ — treat as Arabic search first
  const hasUrduLetters = /[ےگپچژ]/.test(q);
  const hasArabicLetters = /[\u0621-\u064A]/.test(q);
  if (hasArabicLetters && !hasUrduLetters) return true;
  return false;
}

export function searchAyahsByUrdu(
  query: string,
  ayahCards: Record<string, AyahCard>,
  limit = 80,
): MatchItem[] {
  const q = normalizeUrduQuery(query);
  if (q.length < 2) return [];
  const out: MatchItem[] = [];
  for (const [ayahId, card] of Object.entries(ayahCards)) {
    const hay = normalizeUrduQuery(card.ur);
    if (!hay.includes(q)) continue;
    out.push({
      ayahId,
      page: card.p,
      arabic: card.ar,
      urdu: card.ur,
    });
    if (out.length >= limit) break;
  }
  return out;
}

export function hitsToMatchItems(
  hits: SearchHit[],
  ayahCards: Record<string, AyahCard>,
): MatchItem[] {
  const out: MatchItem[] = [];
  const seen = new Set<string>();
  for (const h of hits) {
    if (seen.has(h.a)) continue;
    seen.add(h.a);
    const card = ayahCards[h.a];
    if (!card) continue;
    out.push({
      ayahId: h.a,
      page: card.p,
      arabic: card.ar,
      urdu: card.ur,
      matchedArabic: h.ar,
      matchedWordId: h.w,
    });
  }
  return out;
}

export function buildMatchList(
  query: string,
  index: Record<string, SearchHit[]>,
  ayahCards: Record<string, AyahCard>,
  limit = 80,
): { items: MatchItem[]; mode: "arabic" | "urdu" | "both" } {
  const q = query.trim();
  if (!q) return { items: [], mode: "arabic" };

  const arabicHits = searchQuranWords(q, index, limit);
  const fromArabic = hitsToMatchItems(arabicHits, ayahCards);
  const fromUrdu = searchAyahsByUrdu(q, ayahCards, limit);

  if (fromArabic.length && fromUrdu.length) {
    const seen = new Set(fromArabic.map((i) => i.ayahId));
    const merged = [...fromArabic];
    for (const item of fromUrdu) {
      if (seen.has(item.ayahId)) continue;
      seen.add(item.ayahId);
      merged.push(item);
      if (merged.length >= limit) break;
    }
    return { items: merged, mode: "both" };
  }
  if (fromArabic.length) return { items: fromArabic, mode: "arabic" };
  return { items: fromUrdu, mode: "urdu" };
}
