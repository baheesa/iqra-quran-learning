/** Helpers for mushaf word tips (offline Iqra). */

const PUNCT_RE =
  /^[\u06D6-\u06ED\u0640\u0610-\u061A\u064B-\u065F\u0670ۣۖۗۘۙۚۛۜ۟۠ۡۢۤۥۦۧۨ۩۪ۭ\s\-–—….,:;!?﴾﴿]+$/u;

export function isPunctuationToken(arabic: string): boolean {
  const t = arabic.trim();
  if (!t) return true;
  if (PUNCT_RE.test(t)) return true;
  if (!/[\u0621-\u064A\u066E\u066F\u0671-\u06D3]/u.test(t)) return true;
  return false;
}

export function stripArabic(arabic: string): string {
  return arabic
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/gu, "")
    .replace(/\u0671/gu, "ا")
    .replace(/[آأإ]/gu, "ا")
    .replace(/ى/gu, "ي")
    .replace(/ة/gu, "ه")
    .replace(/[^\u0621-\u064A]/gu, "");
}

export function isFiToken(arabic: string): boolean {
  const n = stripArabic(arabic);
  return n === "في" || n === "فى";
}

export function cleanMeaning(urdu: string): string {
  return urdu
    .replace(/[()（）]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

type PronounKind = "hum" | "kum" | "hunna" | "kunna" | "huma" | "kuma" | "na";

type PronounSpec = {
  kind: PronounKind;
  label: string;
  markers: string[];
};

const PRONOUN_SPECS: PronounSpec[] = [
  {
    kind: "huma",
    label: "ان دونوں کے",
    markers: ["ان دونوں", "دونوں کے", "ان کے"],
  },
  {
    kind: "kuma",
    label: "تم دونوں کے",
    markers: ["تم دونوں", "تمہارے"],
  },
  {
    kind: "hunna",
    label: "ان کے",
    markers: ["ان کے", "ان کا", "ان کی", "انھیں", "انہیں", "اپنے", "اپنا", "اپنی"],
  },
  {
    kind: "kunna",
    label: "تمہارے",
    markers: ["تمہارے", "تمہارا", "تمہاری", "تمہیں", "اپنے", "اپنا", "اپنی"],
  },
  {
    kind: "hum",
    label: "ان کے",
    markers: ["ان کے", "ان کا", "ان کی", "انھیں", "انہیں", "اُن", "اپنے", "اپنا", "اپنی"],
  },
  {
    kind: "kum",
    label: "تمہارے",
    markers: ["تمہارے", "تمہارا", "تمہاری", "تمہیں", "تم کو", "اپنے", "اپنا", "اپنی"],
  },
  {
    kind: "na",
    label: "ہمارے",
    markers: ["ہمارے", "ہمارا", "ہماری", "ہمیں", "اپنے", "اپنا", "اپنی"],
  },
];

/** Detect attached pronoun on Arabic (هم / كم / هن / …). Longer suffixes first. */
export function detectPronounSuffix(arabic: string): PronounSpec | null {
  const n = stripArabic(arabic);
  if (n.length < 3) return null;
  const checks: Array<{ end: string; kind: PronounKind }> = [
    { end: "هما", kind: "huma" },
    { end: "كما", kind: "kuma" },
    { end: "هن", kind: "hunna" },
    { end: "كن", kind: "kunna" },
    { end: "هم", kind: "hum" },
    { end: "كم", kind: "kum" },
    { end: "نا", kind: "na" },
  ];
  for (const c of checks) {
    if (n.endsWith(c.end) && n.length > c.end.length + 1) {
      return PRONOUN_SPECS.find((s) => s.kind === c.kind) ?? null;
    }
  }
  return null;
}

function meaningHasPossessive(meaning: string, spec: PronounSpec): boolean {
  return spec.markers.some((m) => meaning.includes(m));
}

/** Fix awkward order like "بیٹوں کو تمہارے" → "تمہارے بیٹوں کو". */
function reorderTrailingPossessive(meaning: string): string {
  const m = meaning.match(
    /^(.+?)\s+(تمہارے|تمہارا|تمہاری|ان کے|ان کا|ان کی|ہمارے|ہمارا|ہماری)$/u,
  );
  if (!m) return meaning;
  return `${m[2]} ${m[1]}`.replace(/\s+/g, " ").trim();
}

function ensurePronounPossessive(arabic: string, meaning: string): string {
  let next = reorderTrailingPossessive(meaning);
  const spec = detectPronounSuffix(arabic);
  if (!spec) return next;
  if (meaningHasPossessive(next, spec)) return next;
  // Naturalize bare plurals: بیٹوں → بیٹے after ان کے / تمہارے
  const noun = next.replace(/^(بیٹوں|اولادوں)$/u, (_, w: string) =>
    w === "بیٹوں" ? "بیٹے" : w,
  );
  return `${spec.label} ${noun}`.replace(/\s+/g, " ").trim();
}

/**
 * When this word is the first half of an idāfa (e.g. أَبْنَاءِ) and the next
 * word carries هم/كم (e.g. بُعُولَتِهِنَّ), fold a short possessive tip.
 */
function composeIdafaWithNext(
  arabic: string,
  meaning: string,
  nextArabic?: string | null,
  nextMeaning?: string | null,
): string {
  if (detectPronounSuffix(arabic)) return meaning;
  if (!nextArabic || !nextMeaning) return meaning;
  const nextSpec = detectPronounSuffix(nextArabic);
  if (!nextSpec) return meaning;

  const bare = cleanMeaning(meaning);
  if (bare.length > 18) return meaning;
  if (meaningHasPossessive(bare, nextSpec)) return meaning;

  const nextClean = cleanMeaning(nextMeaning);
  const owner =
    nextClean.match(
      /(شوہروں|شوہر|بھائیوں|بھائی|بہنوں|بہن|آباء|باپوں|باپ|آبا)/u,
    )?.[1] ?? null;

  if (owner) {
    const noun = bare.replace(/وں$/u, "ے");
    return `${owner} کے ${noun}`.replace(/\s+/g, " ").trim();
  }

  return `${nextSpec.label} ${bare}`.replace(/\s+/g, " ").trim();
}

/**
 * When previous token is فِي / فِى ("میں"), ensure the noun tip reads
 * e.g. "گمراہی میں" / "زمین میں" instead of bare "گمراہی" / "زمین".
 * Also completes هم/كم possessives missing from the raw gloss.
 */
export function composeWordMeaning(
  arabic: string,
  rawMeaning: string | null | undefined,
  prevArabic?: string | null,
  prevMeaning?: string | null,
  nextArabic?: string | null,
  nextMeaning?: string | null,
): string | null {
  if (isPunctuationToken(arabic)) return null;
  if (!rawMeaning || !String(rawMeaning).trim()) return null;

  let meaning = cleanMeaning(String(rawMeaning));

  if (prevArabic && isFiToken(prevArabic)) {
    const prev = cleanMeaning(String(prevMeaning || "میں"));
    const prevIsFiSense =
      prev === "میں" || prev.endsWith(" میں") || prev === "في";
    if (prevIsFiSense && !meaning.includes("میں")) {
      meaning = `${meaning} میں`;
    }
  }

  meaning = ensurePronounPossessive(arabic, meaning);
  meaning = composeIdafaWithNext(arabic, meaning, nextArabic, nextMeaning);

  return meaning;
}

export function normalizeSearchForm(arabic: string): string {
  return stripArabic(arabic);
}
