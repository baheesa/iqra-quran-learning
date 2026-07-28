/** Core Arabic normalize with controllable dagger-alif handling. */
function normalizeArabicCore(text: string, daggerTo: "" | "ا"): string {
  return text
    .normalize("NFKD")
    .replace(/\u0670/g, daggerTo)
    .replace(/[\u064B-\u065F\u06D6-\u06ED]/g, "")
    .replace(/\u0640/g, "") // tatweel
    .replace(/[ٱأإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/\s+/g, "")
    .trim();
}

/**
 * Strip Arabic combining marks for loose vocabulary matching.
 * Dagger alif (ٰ) becomes a written alef so عَٰلَم → عالم.
 */
export function normalizeArabic(text: string): string {
  return normalizeArabicCore(text, "ا");
}

/**
 * Lookup candidates for a Quran surface form — never invents meanings,
 * only alternate spellings/prefixes so Muallim glosses can match.
 */
export function arabicLookupCandidates(text: string): string[] {
  const bases = [
    normalizeArabicCore(text, "ا"),
    normalizeArabicCore(text, ""),
  ].filter(
    (value, index, all) => value.length > 0 && all.indexOf(value) === index,
  );

  const keys = new Set<string>(bases);

  for (const base of bases) {
    let current = base;
    for (let step = 0; step < 4; step += 1) {
      let next = current;
      if (next.startsWith("وال") && next.length > 4) {
        next = next.slice(3);
      } else if (next.startsWith("بال") && next.length > 4) {
        next = next.slice(3);
      } else if (next.startsWith("كال") && next.length > 4) {
        next = next.slice(3);
      } else if (next.startsWith("فال") && next.length > 4) {
        next = next.slice(3);
      } else if (next.startsWith("لل") && next.length > 3) {
        next = next.slice(2);
      } else if (next.startsWith("ال") && next.length > 3) {
        next = next.slice(2);
        // Do not strip bare ل — it creates false matches (لولا ↔ ولا)
      } else if (/^[وفبك]/.test(next) && next.length > 3) {
        next = next.slice(1);
      } else {
        break;
      }
      keys.add(next);
      current = next;
    }
  }

  return [...keys];
}

export function arabicIncludes(haystack: string, needle: string): boolean {
  const a = normalizeArabic(haystack);
  const b = normalizeArabic(needle);
  if (!a || !b) {
    return false;
  }
  return a.includes(b) || b.includes(a);
}
