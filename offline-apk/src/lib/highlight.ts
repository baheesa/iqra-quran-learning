/** Light highlight helpers for search matches (Arabic / Urdu). */

import { normalizeSearchForm, stripArabic } from "./meanings";
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

export function tokenMatchesSearch(token: string, needle: string): boolean {
  const n = needle.trim();
  if (!n) return false;
  const form = normalizeSearchForm(token);
  const q = normalizeSearchForm(n);
  if (q && form.includes(q)) return true;
  const urTok = normalizeUrduQuery(token);
  const urQ = normalizeUrduQuery(n);
  return Boolean(urQ && urTok.includes(urQ));
}

export function tokenMatchesArabicForm(
  token: string,
  matchedArabic: string | undefined,
): boolean {
  if (!matchedArabic) return false;
  return (
    stripArabic(token) === stripArabic(matchedArabic) ||
    normalizeSearchForm(token) === normalizeSearchForm(matchedArabic)
  );
}

export { escapeRegExp };
