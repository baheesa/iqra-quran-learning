/** Light highlight helpers for search matches (Arabic / Urdu). */

import {
  normalizeSearchForm,
  searchFormVariants,
  stripArabic,
} from "./meanings";
import { normalizeUrduQuery } from "./quran-search";

const DIACRITIC_RE = /[\u064B-\u065F\u0670\u06D6-\u06ED]/u;

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Highlight a literal substring (case-insensitive for Latin). */
export function highlightLiteral(
  text: string,
  needle: string,
): Array<{ text: string; hit: boolean }> {
  const q = needle.trim();
  if (!q || !text) return [{ text, hit: false }];
  const parts: Array<{ text: string; hit: boolean }> = [];
  const lower = text.toLowerCase();
  const qLower = q.toLowerCase();
  let i = 0;
  while (i < text.length) {
    const at = lower.indexOf(qLower, i);
    if (at < 0) {
      parts.push({ text: text.slice(i), hit: false });
      break;
    }
    if (at > i) parts.push({ text: text.slice(i, at), hit: false });
    parts.push({ text: text.slice(at, at + q.length), hit: true });
    i = at + q.length;
  }
  return parts.length ? parts : [{ text, hit: false }];
}

/**
 * Map normalized form back onto original text spans (skips tashkeel in the
 * needle while still marking the full vocalized original substring).
 */
function highlightNormalized(
  text: string,
  qNorm: string,
  normalizeChar: (ch: string) => string,
): Array<{ text: string; hit: boolean }> {
  if (!qNorm) return [{ text, hit: false }];
  const map: number[] = [];
  let norm = "";
  for (let i = 0; i < text.length; i += 1) {
    const piece = normalizeChar(text[i]!);
    for (let k = 0; k < piece.length; k += 1) {
      norm += piece[k]!;
      map.push(i);
    }
  }
  const parts: Array<{ text: string; hit: boolean }> = [];
  let cursor = 0;
  let searchFrom = 0;
  while (searchFrom < norm.length) {
    const at = norm.indexOf(qNorm, searchFrom);
    if (at < 0) break;
    const startOrig = map[at]!;
    let endOrig = map[at + qNorm.length - 1]! + 1;
    while (endOrig < text.length && DIACRITIC_RE.test(text[endOrig]!)) {
      endOrig += 1;
    }
    if (startOrig > cursor) {
      parts.push({ text: text.slice(cursor, startOrig), hit: false });
    }
    parts.push({ text: text.slice(startOrig, endOrig), hit: true });
    cursor = endOrig;
    searchFrom = at + qNorm.length;
  }
  if (cursor < text.length) {
    parts.push({ text: text.slice(cursor), hit: false });
  }
  return parts.length ? parts : [{ text, hit: false }];
}

/**
 * Best-effort highlight for mixed Arabic/Urdu/English search queries.
 * Tries literal match, then Urdu-normalized, then Arabic (diacritic-insensitive).
 */
export function highlightSearchText(
  text: string,
  needle: string,
): Array<{ text: string; hit: boolean }> {
  const q = needle.trim();
  if (!q || !text) return [{ text, hit: false }];

  const literal = highlightLiteral(text, q);
  if (literal.some((p) => p.hit)) return literal;

  const urQ = normalizeUrduQuery(q);
  if (urQ.length >= 1) {
    const urParts = highlightNormalized(text, urQ, (ch) =>
      normalizeUrduQuery(ch),
    );
    if (urParts.some((p) => p.hit)) return urParts;
  }

  const arQ = normalizeSearchForm(q);
  if (arQ.length >= 1) {
    const arParts = highlightNormalized(text, arQ, (ch) =>
      normalizeSearchForm(ch),
    );
    if (arParts.some((p) => p.hit)) return arParts;
  }

  // Whitespace token fallback (ayah / phrase rows)
  if (/\s/.test(text)) {
    const parts: Array<{ text: string; hit: boolean }> = [];
    const chunks = text.split(/(\s+)/u);
    for (const chunk of chunks) {
      if (!chunk) continue;
      if (/^\s+$/u.test(chunk)) {
        parts.push({ text: chunk, hit: false });
        continue;
      }
      parts.push({ text: chunk, hit: tokenMatchesSearch(chunk, q) });
    }
    if (parts.some((p) => p.hit)) return parts;
  }

  return [{ text, hit: false }];
}

/** True when a mushaf / card token matches the search needle (diacritics-insensitive). */
export function tokenMatchesSearch(token: string, needle: string): boolean {
  const n = needle.trim();
  if (!n) return false;

  // Multi-word queries: highlight each searched word, not only the first.
  const parts = n
    .split(/[\s\u0640]+/u)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length > 1) {
    return parts.some((part) => tokenMatchesSearch(token, part));
  }

  const needleVariants = searchFormVariants(n);
  const tokenVariants = searchFormVariants(token);
  for (const q of needleVariants) {
    if (!q) continue;
    for (const form of tokenVariants) {
      if (form.includes(q)) return true;
    }
  }

  const form = normalizeSearchForm(token);
  const q = normalizeSearchForm(n);
  if (q && form.includes(q)) return true;

  const urTok = normalizeUrduQuery(token);
  const urQ = normalizeUrduQuery(n);
  return Boolean(urQ && urTok.includes(urQ));
}

/** Match Arabic token against known matched Arabic form(s) from the index. */
export function tokenMatchesArabicForm(
  token: string,
  matchedArabic: string | string[] | undefined,
): boolean {
  if (!matchedArabic) return false;
  const forms = Array.isArray(matchedArabic)
    ? matchedArabic
    : matchedArabic
        .split(/[\s\u0640]+/u)
        .map((p) => p.trim())
        .filter(Boolean);
  if (forms.length === 0) return false;
  const tokenVars = new Set(searchFormVariants(token));
  if (tokenVars.size === 0) {
    const n = normalizeSearchForm(token);
    if (n) tokenVars.add(n);
  }
  return forms.some((form) => {
    const formVars = searchFormVariants(form);
    if (formVars.some((fv) => tokenVars.has(fv))) return true;
    return (
      stripArabic(token) === stripArabic(form) ||
      normalizeSearchForm(token) === normalizeSearchForm(form)
    );
  });
}

export { escapeRegExp };
