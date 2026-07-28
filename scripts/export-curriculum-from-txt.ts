/**
 * Export unit vocabulary (words + phrases) and ayah/chunk lists from Muallim TXT.
 * Reads only what is written in the books — does not invent meanings.
 */
import { mkdir, readdir, readFile, writeFile } from "fs/promises";
import path from "path";

import { normalizeArabic } from "../features/teacher/domain/arabic";

const UNITS = [1, 2, 3, 4, 5, 6, 7] as const;
const ARABIC_TOKEN =
  /[\u0621-\u064A\u066E\u066F\u0671-\u06D3\u06FA-\u06FF\u064B-\u065F\u0670\u06D6-\u06ED]+/gu;

type Entry = {
  id: string;
  arabic: string;
  meaning: string;
  unit: number;
  kind: "word" | "phrase";
};

type AyahEntry = {
  id: string;
  unit: number;
  arabic: string;
  meaning: string | null;
  ref?: string | null;
};

function hasArabic(text: string): boolean {
  return /[\u0621-\u064A]/u.test(text);
}

function hasUrduLetters(text: string): boolean {
  return /[\u0679\u067E\u0686\u0688\u0691\u06A9\u06AF\u06BE\u06C1\u06C3\u06D2]/u.test(
    text,
  );
}

function looksLikeUrduGloss(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  if (hasUrduLetters(t)) return true;
  // Shared-script Urdu often lacks ے/ھ — detect via common function words
  if (
    /(?:^|[\s،])(?:کے|کی|کو|کا|ہے|ہیں|اور|سے|میں|پر|نہیں|جو|یہ|وہ|ایک|سب|لیے|لئے)(?:$|[\s،])/u.test(
      t,
    )
  ) {
    return true;
  }
  return false;
}

function isArabicSurface(text: string): boolean {
  const t = text.trim();
  if (!t || !hasArabic(t)) return false;
  if (/[ےھٹڈڑںگچپ]/.test(t)) return false;
  // Pure Urdu / instructional lemmas (آسمان، جنت، شرط…)
  if (hasUrduLetters(t) && !/[\u064B-\u065F\u0670]/.test(t)) return false;
  if (/->|→|➔/.test(t)) return false;
  if (/[.*_|+]/.test(t) && !/\s/.test(t)) return false;
  if (/^[.\d\-–—]/.test(t)) return false;
  if (/[a-zA-Z0-9]/.test(t)) return false;
  if (
    /درج ذیل|پیراگراف|الحمد لله|سوال|ترجمہ|مطلب بتائ|غور کریں|زبانی جواب|تخلیق اور اصول|کائنات|زمین انسان|عفا معاف|^س\s*\d|علم القرآن|معلم القرآن|آسمان انداز|وجی اور|وی اور/u.test(
      t,
    )
  ) {
    return false;
  }
  if (
    /^(اس|یہ|وہ|کیا|یا|اور|کے|کی|کو|کا|میں|سے|پر|سب|زمین|آسمان|جنت|شرط|شمار|تمام|ماضی|مسلمان|تیاری|وجی|وی)$/u.test(
      t,
    )
  ) {
    return false;
  }
  return true;
}

function cleanArabic(value: string): string {
  return value
    .replace(/^[•●○*\d.\-)\s]+/u, "")
    .replace(/[)）\]】«»"']+$/u, "")
    .replace(/^\(+|\)+$/gu, "")
    .replace(/[﴿﴾]/gu, "")
    .replace(/\*\*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanMeaning(value: string): string {
  let m = value
    .replace(/^[（(\s]+|[）)\s]+$/gu, "")
    .replace(/\s+/g, " ")
    .trim();
  // Restore leading سب when splitArabicFormAndUrdu ate it (سب سے زیادہ…)
  if (
    /^سے\s+(زیادہ|بڑا|چھوٹا|شدید|مضبوط|گھٹیا|بہتر|برا|پہلا|قریب|اچھا)/u.test(m)
  ) {
    m = `سب ${m}`;
  }
  return m;
}

/**
 * Prefixed possessive gloss when Arabic ends in a clear pronoun suffix
 * but the Urdu meaning is only the bare noun (أَبْصَارُهَا → اس کی آنکھیں).
 */
function ensurePossessiveMeaning(arabic: string, meaning: string): string {
  const ar = arabic.trim();
  const m = meaning.trim();
  if (!ar || !m || /\s/.test(ar)) return m;
  if (/الله|للّه|لله/u.test(ar)) return m;
  if (
    /(?:اس کی|اس کا|اس کے|ان کی|ان کا|ان کے|تمہار|تیرا|تیری|میرا|میری|ہمار|اپن|اسکے|انکے)/u.test(
      m,
    )
  ) {
    return m;
  }

  let prefix: string | null = null;
  if (/هَا$/u.test(ar)) prefix = "اس کی";
  else if (/هُمْ$/u.test(ar)) prefix = "ان کا";
  else if (/هِمْ$/u.test(ar)) prefix = "ان کے";
  else if (/كُمْ$/u.test(ar)) prefix = "تمہارا";
  else if (/هُمَا$/u.test(ar)) prefix = "ان دونوں کا";
  else if (/كُمَا$/u.test(ar)) prefix = "تم دونوں کا";
  else if (/هُنَّ$/u.test(ar)) prefix = "ان کی";
  else if (/كُنَّ$/u.test(ar)) prefix = "تم سب کی";
  else if (/[ُِ]هُ$/u.test(ar)) prefix = "اس کا";
  else if (/[ُِ]هِ$/u.test(ar)) prefix = "اس کے";
  else if (/[ُِ]كَ$/u.test(ar)) prefix = "تیرا";
  else if (/[ُِ]كِ$/u.test(ar)) prefix = "تیری";
  else if (/[ُِ]نَا$/u.test(ar)) prefix = "ہمارا";
  else if (/[ُِ]يَ$/u.test(ar) || /يَ$/u.test(ar)) prefix = "میرا";

  if (!prefix) return m;
  // Prefer اس کے with masculine plural-looking glosses (دروازے) vs اس کی (آنکھیں)
  if (prefix === "اس کی" && /ے$/u.test(m) && !/(یں|ییں)$/u.test(m)) {
    prefix = "اس کے";
  }
  if (prefix === "تمہارا" && /(یں|ات)$/u.test(m)) {
    prefix = "تمہاری";
  }
  return `${prefix} ${m}`;
}

/** True when the colon-right side is a pure Urdu gloss (not FORM + urdu). */
function looksLikePureUrduGloss(right: string): boolean {
  const t = right.trim();
  if (!t || !looksLikeUrduGloss(t)) return false;
  // Vocalized Arabic forms belong in FORM+urdu splits
  if (/[\u064B-\u065F\u0670]/.test(t)) return false;
  const first = t.split(/\s+/)[0] ?? "";
  if (
    /^(سب|سے|ایک|یہ|وہ|جو|نہیں|میں|تم|ہم|اس|ان|کے|کی|کو|کا|پر|اور|بہت|زیادہ|کم|قریب|تر|کمتر)$/u.test(
      first,
    )
  ) {
    return true;
  }
  if (hasUrduLetters(first)) return true;
  return false;
}


function tokenizeArabic(text: string): string[] {
  return text.match(ARABIC_TOKEN) ?? [];
}

function looksLikeMeaning(text: string): boolean {
  const m = cleanMeaning(text);
  if (!m || m.length < 1 || m.length > 40) return false;
  if (/^\d+([،,\s]+\d+)*\.?$/.test(m)) return false;
  if (/\d/.test(m)) return false;
  if (/->|→|➔/.test(m)) return false;
  // Arabic grammar forms mistaken as Urdu glosses
  if (/^(?:كَانَ|لَا|وَكَانَ|فَلَا|إِنَّ|يَا|إِلَى|عَلَى|مِنَ|أَنَّ|وَ|لَمْ)\s/u.test(m)) {
    return false;
  }
  // Mixed Arabic form + open paren debris
  if (/[（(]/.test(m) && hasArabic(m)) return false;
  // "أَبْنَاؤُهُمُ بیٹوں" — Arabic form (with harakat) then Urdu
  const firstToken = m.split(/\s+/)[0] ?? "";
  if (
    /[\u064B-\u065F\u0670]/.test(firstToken) &&
    m.includes(" ") &&
    looksLikeUrduGloss(m)
  ) {
    return false;
  }
  if (/[\u064B-\u065F\u0670]/.test(m) && !hasUrduLetters(m) && !looksLikeUrduGloss(m)) {
    return false;
  }
  if (isNoiseMeaning(m, { maxLength: 40 })) return false;
  if (/^(کیا|کے|کی|کو|کا|اس|یہ|وہ|اور|ہے|ہیں|میں|نے|سے)$/u.test(m)) return false;
  if (hasUrduLetters(m)) return true;
  if (looksLikeUrduGloss(m)) return true;
  if (hasArabic(m) && m.length <= 24 && !/->|→/.test(m) && !/\s{2,}/.test(m)) {
    return true;
  }
  return false;
}

/**
 * Split trailing Urdu from `ARABIC_FORM urdu` (Unit 5: أَبْنَاؤُهُمُ بیٹوں).
 */
function splitArabicFormAndUrdu(
  right: string,
): { formArabic: string; meaning: string } | null {
  const tokens = right.trim().split(/\s+/).filter(Boolean);
  if (tokens.length < 2) return null;

  let splitAt = -1;
  for (let i = 1; i < tokens.length; i += 1) {
    const tok = tokens[i]!;
    const prev = tokens[i - 1]!;
    if (hasUrduLetters(tok)) {
      splitAt = i;
      break;
    }
    // After a vocalized Arabic form, an unvocalized token starts the Urdu gloss
    if (
      /[\u064B-\u065F\u0670]/.test(prev) &&
      !/[\u064B-\u065F\u0670]/.test(tok) &&
      /[\u0621-\u064A\u0671-\u06D3]/.test(tok)
    ) {
      splitAt = i;
      break;
    }
  }
  if (splitAt < 1) return null;

  const formArabic = cleanArabic(tokens.slice(0, splitAt).join(" "));
  const meaning = cleanMeaning(tokens.slice(splitAt).join(" "));
  if (!formArabic || tokenizeArabic(formArabic).length === 0) return null;
  if (hasUrduLetters(formArabic)) return null;
  // Never treat Urdu particles (سب، سے، …) as an Arabic "form"
  if (
    /^(سب|سے|کے|کی|کو|کا|میں|پر|اور|ایک|یہ|وہ|جو|نہیں)$/u.test(formArabic)
  ) {
    return null;
  }
  if (!looksLikeUrduGloss(meaning) || isNoiseMeaning(meaning, { maxLength: 40 })) {
    return null;
  }
  if (/^(کیا|کے|کی|کو|کا|اس|یہ|وہ|اور|ہے|ہیں|میں|نے|سے|سب)$/u.test(meaning)) {
    return null;
  }
  return { formArabic, meaning };
}

/**
 * Unit 2–5 lemma lines, e.g.:
 * أُمَّةٌ : كَانَ أُمَّةً (عظیم پیشوا)
 * أَبْنَاء : أَبْنَاؤُهُمُ بیٹوں
 * Prefer the Urdu gloss — never store the Arabic form as meaning.
 */
function parseLemmaColonLine(
  line: string,
): { arabic: string; meaning: string; formArabic?: string } | null {
  const colon = line.match(
    /^([^\n:：→]{2,60}?)\s*(?:[:：]|->|→|➔)\s*([^\n]{1,120})$/u,
  );
  if (!colon) return null;
  const arabic = cleanArabic(colon[1]!);
  if (!isArabicSurface(arabic)) return null;
  if (/معلم القرآن|نام کتاب|مصنف|ناشر/u.test(arabic)) return null;

  const right = colon[2]!.trim();
  const formParen = right.match(/^(.+?)\s*[（(]\s*([^)）]+)\s*[)）]\s*$/u);
  if (formParen) {
    const formArabic = cleanArabic(formParen[1]!);
    let meaning = cleanMeaning(formParen[2]!);
    // Reject truncated paren glosses like (میں نے)
    if (/^(میں نے|تم نے|وہ|جو|نہیں)$/u.test(meaning)) {
      // Keep lemma with a fuller override later if present; skip this weak gloss
      return null;
    }
    if (!looksLikeUrduGloss(meaning) || isNoiseMeaning(meaning, { maxLength: 40 })) {
      return null;
    }
    if (!isArabicSurface(formArabic) && tokenizeArabic(formArabic).length === 0) {
      return null;
    }
    return {
      arabic,
      meaning,
      formArabic: tokenizeArabic(formArabic).length >= 1 ? formArabic : undefined,
    };
  }

  // Pure Urdu gloss first — e.g. أَخْسَرُ : سب سے زیادہ خسارے والا
  // (otherwise "سب" is mistaken for an Arabic form)
  if (looksLikePureUrduGloss(right) && looksLikeMeaning(right)) {
    return { arabic, meaning: cleanMeaning(right) };
  }

  // LEMMA : FORM urdu (no parentheses) — Unit 5 possessive drills
  const split = splitArabicFormAndUrdu(right);
  if (split) {
    return {
      arabic,
      meaning: split.meaning,
      formArabic: split.formArabic,
    };
  }

  // LEMMA : Arabic form without Urdu — skip
  if (isArabicSurface(right) && !looksLikeUrduGloss(right)) {
    return null;
  }
  if (/^(?:وَ|فَ)?(?:كَانَ|لَا|لَمْ|يَا|إِلَى|عَلَى|مِنَ|مِنْ|أَنَّ|وَ)\s/u.test(right)) {
    return null;
  }

  if (!looksLikeMeaning(right)) return null;
  if (isArabicSurface(right) && !looksLikeUrduGloss(right)) return null;
  return { arabic, meaning: cleanMeaning(right) };
}

function isParticleForm(form: string): boolean {
  const f = cleanArabic(form);
  // كَانَ / لَا drills: Urdu gloss belongs on the lemma
  if (/^(?:وَ|فَ)?(?:كَانَ|لَا)/u.test(f)) return false;
  return /^(?:إِلَّا|فِي|إِلَى|عَلَى|مِنَ|مِنْ|أَنَّ|يَا|وَ|لِ)/u.test(f);
}
const VOCAB_GLOSS_OVERRIDES: Record<
  number,
  Array<{ arabic: string; meaning: string }>
> = {
  2: [
    { arabic: "بِالْأُذُنِ", meaning: "کان کے بدلے" },
    { arabic: "بِالسِّنِّ", meaning: "دانت کے بدلے" },
    { arabic: "بِالْأَنْفِ", meaning: "ناک کے بدلے" },
    { arabic: "بِالْأُنْثَى", meaning: "خاتون کے بدلے" },
    { arabic: "بِالْعَبْدِ", meaning: "غلام کے بدلے" },
    { arabic: "بِالْحُرِّ", meaning: "آزاد مرد کے بدلے" },
  ],
  6: [
    { arabic: "أُشْرِكُ", meaning: "میں شرک کرتا ہوں" },
    { arabic: "لَمْ أُشْرِكْ", meaning: "میں نے شرک نہیں کیا" },
  ],
};

function applyVocabGlossOverrides(unit: number, entries: Entry[]): Entry[] {
  const cleaned = entries.filter((entry) => {
    if (!isArabicSurface(entry.arabic)) return false;
    if (!looksLikeMeaning(entry.meaning) && !looksLikeUrduGloss(entry.meaning)) {
      return false;
    }
    if (/\d/.test(entry.meaning) || /\d/.test(entry.arabic)) return false;
    if (/^[.\-]/.test(entry.arabic)) return false;
    if (/[（(]/.test(entry.arabic)) return false;
    const first = entry.meaning.split(/\s+/)[0] ?? "";
    if (/[\u064B-\u065F\u0670]/.test(first) && entry.meaning.includes(" ")) {
      return false;
    }
    if (/^\|/.test(entry.meaning)) return false;
    return true;
  }).map((entry) => ({
    ...entry,
    meaning: ensurePossessiveMeaning(entry.arabic, entry.meaning),
  }));

  const overrides = VOCAB_GLOSS_OVERRIDES[unit];
  if (!overrides?.length) return cleaned;

  const byKey = new Map(
    cleaned.map((entry) => [normalizeArabic(entry.arabic), entry] as const),
  );
  for (const item of overrides) {
    const key = normalizeArabic(item.arabic);
    const existing = byKey.get(key);
    if (existing) {
      byKey.set(key, { ...existing, meaning: item.meaning });
    } else {
      byKey.set(key, {
        id: `u${unit}-word-${key.slice(0, 40)}`,
        arabic: item.arabic,
        meaning: item.meaning,
        unit,
        kind: tokenizeArabic(item.arabic).length > 1 ? "phrase" : "word",
      });
    }
  }
  return [...byKey.values()];
}

/** Ayah/chunk meanings may be longer (WBW phrase or published ayah Urdu). */
function looksLikeAyahMeaning(text: string): boolean {
  const m = cleanMeaning(text);
  if (!m || m.length < 2 || m.length > 220) return false;
  if (/^\d+([،,\s]+\d+)*\.?$/.test(m)) return false;
  if (isNoiseMeaning(m, { maxLength: 220, allowLongProse: true })) return false;
  if (/^(کیا|کے|کی|کو|کا|اس|یہ|وہ|اور|ہے|ہیں)$/u.test(m)) return false;
  return looksLikeUrduGloss(m);
}

function isNoiseMeaning(
  text: string,
  opts: { maxLength?: number; allowLongProse?: boolean } = {},
): boolean {
  const maxLength = opts.maxLength ?? 40;
  const m = text.trim();
  if (!m) return true;
  if (m.length > maxLength) return true;
  const banned =
    /تحریر کریں|ترجمہ کریں|ترجمہ آپ|ترجمہ اب|عکس بندی|انٹرنیٹ|اجازت نہیں|جملہ بن|ذیل میں|درج ذیل|درج قرآنی|مکمل یا جزوی|شرعی|قانونی|اخلاقی جرم|آسمانی\s*کتاب|معلم القرآن|حقوق|پبلشر|ناشر|مطبع|وی\s+اور|یوں جملہ|مطلب تحریر|مطلب بتائ|صفحہ\s*\d|سبق\s*\d|یہ اس لیے|وہ ایمان لائے|زبانی جواب|پر غور|پیراگراف|تخلیق|کائنات|کتاب کے|\(\s*\d+/u;
  if (banned.test(m)) return true;
  if (!opts.allowLongProse) {
    if (/[.۔]/.test(m) && m.length > 24) return true;
    if ((m.match(/\s/g) ?? []).length >= 6) return true;
  }
  return false;
}

/**
 * Muallim often stores truncated paren glosses for demo phrases
 * (e.g. "اپنے بندوں کو" for يُبَشِّرُ اللَّهُ عِبَادَهُ).
 */
function isIncompletePhraseMeaning(
  arabic: string,
  meaning: string | null | undefined,
): boolean {
  if (!meaning) return true;
  const m = cleanMeaning(meaning);
  const tokens = tokenizeArabic(arabic);
  if (tokens.length < 2) return false;

  if (
    /(?:^|[\s،])(?:کو|کے|کی|کا|سے|پر|میں|اور|والوں|والے|والی)$/u.test(m) &&
    m.length < 18
  ) {
    return true;
  }
  // Verb-only Muallim gloss ending in ہے/ہیں while Arabic has more words
  if (
    /(?:ہے|ہیں)$/u.test(m) &&
    tokens.length >= 2 &&
    m.length < 22
  ) {
    return true;
  }
  // Single short noun gloss for a multi-word verb phrase (e.g. "ہوائیں")
  if (tokens.length >= 2 && (m.match(/\S+/gu) ?? []).length <= 1) return true;
  if (tokens.length >= 2 && m.length < 14) return true;
  if (tokens.length >= 3 && m.length < 22) return true;
  if (tokens.length >= 4 && m.length < 28) return true;
  if (tokens.length >= 3 && (m.match(/\S+/gu) ?? []).length <= 3 && m.length < 24) {
    return true;
  }
  return false;
}

function preferMeaning(a: string, b: string, arabic: string): string {
  const aIncomplete = isIncompletePhraseMeaning(arabic, a);
  const bIncomplete = isIncompletePhraseMeaning(arabic, b);
  if (aIncomplete !== bIncomplete) return aIncomplete ? b : a;
  return b.length >= a.length ? b : a;
}

function isNoiseArabic(arabic: string): boolean {
  if (/^\s*[أا]?-\s*[أا]?\s*$/u.test(arabic)) return true;
  if (/^[أ-ي]\s*-\s*[أ-ي]/u.test(arabic) && arabic.length < 12) return true;
  if (/\s=\s/.test(arabic) && arabic.includes("+")) return true;
  if (/[:：]/.test(arabic)) return true;
  if (/[a-zA-Z]/.test(arabic)) return true;
  if (/\|/.test(arabic)) return true;
  if (/وهبنا\s+من/u.test(arabic)) return true;
  // Mixed Urdu+Arabic OCR debris like "أَحْيَا زنده"
  if (/[ےھٹڈڑںگچپ]/.test(arabic)) return true;
  if (hasUrduLetters(arabic)) return true;
  return false;
}

function addEntry(
  map: Map<string, Entry>,
  unit: number,
  arabicRaw: string,
  meaningRaw: string,
  ayahMap?: Map<string, AyahEntry>,
): void {
  const arabic = cleanArabic(arabicRaw);
  const meaning = ensurePossessiveMeaning(arabic, cleanMeaning(meaningRaw));
  if (!isArabicSurface(arabic) || !looksLikeMeaning(meaning)) return;
  if (isNoiseArabic(arabic)) return;
  // Skip letter-building drills: ز - ك - ا - ة
  if (/^[أ-ي]\s*-\s*[أ-ي]/u.test(arabic)) return;
  if (/وهبنا\s+من/u.test(arabic)) return;
  // Skip undiacritic / OCR debris lemmas
  if (/^(رسول|آدم)$/u.test(arabic)) return;
  // Skip long demo sentences attached as "meaning"
  if (/^(یہ|وہ|تم)\s.+(ہے|ہیں)\.?$/u.test(meaning) && meaning.length > 22) {
    return;
  }

  const tokens = tokenizeArabic(arabic);
  if (tokens.length === 0 || tokens.length > 8) return;
  if (tokens.length >= 2 && meaning.length < 3) return;
  const kind: "word" | "phrase" = tokens.length === 1 ? "word" : "phrase";
  const key = `${unit}:${normalizeArabic(arabic)}`;
  if (!key.endsWith(":") && key.length < 4) return;

  const next: Entry = {
    id: `u${unit}-${kind}-${normalizeArabic(arabic).slice(0, 40)}`,
    arabic,
    meaning,
    unit,
    kind,
  };
  const existing = map.get(key);
  if (!existing || preferMeaning(existing.meaning, next.meaning, arabic) === next.meaning) {
    map.set(key, next);
  }

  // Common Quran phrases also belong on the ayahs/chunks page
  if (
    ayahMap &&
    kind === "phrase" &&
    !/[:：]/.test(arabic) &&
    looksLikeQuranChunk(arabic)
  ) {
    const akey = normalizeArabic(arabic);
    if (akey && !ayahMap.has(akey)) {
      ayahMap.set(akey, {
        id: `u${unit}-ayah-${akey.slice(0, 48)}`,
        unit,
        arabic,
        meaning,
      });
    } else if (akey && meaning) {
      const current = ayahMap.get(akey)!;
      current.meaning = preferMeaning(current.meaning ?? "", meaning, arabic);
    }
  }
}

function looksLikeQuranChunk(line: string): boolean {
  const trimmed = cleanArabic(line.replace(/^\d{1,3}[.)]\s*/u, ""));
  if (!trimmed || trimmed.length < 8 || trimmed.length > 160) return false;
  if (!hasArabic(trimmed)) return false;
  if (/\|/.test(trimmed)) return false;
  if (/\d+\.\s*\{/.test(trimmed) || /\)\s*\d+\./.test(trimmed)) return false;

  const banned =
    /معلم القرآن|یونٹ\s*\d|سبق\s*\d|مشق|سوال|ترجمہ|مطلب|کالم|درج ذیل|آپ |کیلئے|پڑھ چکے|غور کیجئے|واضح ہے|جملہ شرط|انجام|\[|\]|\{|\}|تحریر|عکس بندی|انٹرنیٹ|شرعی|قانونی|اخلاقی|یہ اس لیے|وہ ایمان|پیراگراف|تخلیق/u;
  if (banned.test(trimmed)) return false;
  if (/->|→|➔/.test(trimmed)) return false;
  if (hasUrduLetters(trimmed)) return false;

  const tokens = tokenizeArabic(trimmed);
  if (tokens.length < 2 || tokens.length > 22) return false;

  const arabicChars = (trimmed.match(/[\u0621-\u064A]/gu) ?? []).length;
  if (arabicChars < 10) return false;
  return true;
}

function isNumberedOrQuotedExample(line: string): boolean {
  if (/^\d{1,3}[.)]\s*/u.test(line)) return true;
  if (/^\*\s+/u.test(line) && looksLikeQuranChunk(line.replace(/^\*\s+/u, ""))) {
    return true;
  }
  if (/^[（(].+[)）]\s*$/u.test(line) && looksLikeQuranChunk(line)) return true;
  return false;
}

/** Unit 2 style: bare Quran chunks on their own line, optional (meaning). */
function isBareQuranExampleLine(line: string): boolean {
  if (/^\d|^[*|]|^سوال|^مشق/u.test(line)) return false;
  if (/->|→|➔|:|：/.test(line) && !/[（(]/.test(line)) return false;
  // strip optional trailing (meaning)
  const withoutMeaning = line.replace(/\s*[（(][^)）]+[)）]\s*$/u, "").trim();
  if (!looksLikeQuranChunk(withoutMeaning)) return false;
  const tokens = tokenizeArabic(withoutMeaning);
  if (tokens.length < 2 || tokens.length > 20) return false;
  if (withoutMeaning.length > 140) return false;
  // Prefer recognisable Quran openings / particles
  const head = withoutMeaning.slice(0, 12);
  return /^(إِنَّ|فَإِنَّ|وَإِنَّ|لِ|فِي|عَلَى|مِنْ|إِلَى|لَا|قُلْ|يَا|هُوَ|هِيَ|هُمْ|الَّذ|مَنْ|مَا |وَ|فَ|أَ|هَلْ|قَدْ|لَقَدْ|إِذْ|حَتَّى)/u.test(
    head,
  ) || tokens.length >= 4;
}

function splitTrailingMeaning(line: string): {
  arabic: string;
  meaning: string | null;
} {
  const cleaned = cleanArabic(line.replace(/^\d{1,3}[.)]\s*/u, ""));
  // ARABIC ... urduMeaning (urdu letters at end)
  const m = cleaned.match(
    /^(.+?)\s+([^\u0621-\u064A]*[ےھٹڈڑںگچپ][\u0600-\u06FF\s،.؟!]{0,60})$/u,
  );
  if (m && tokenizeArabic(m[1]!).length >= 2 && looksLikeMeaning(m[2]!)) {
    return { arabic: cleanArabic(m[1]!), meaning: cleanMeaning(m[2]!) };
  }
  // paren meaning: ARABIC (urdu)
  const p = cleaned.match(/^(.+?)\s*[（(]\s*([^)）]+)\s*[)）]\s*$/u);
  if (p && tokenizeArabic(p[1]!).length >= 2 && looksLikeMeaning(p[2]!)) {
    return { arabic: cleanArabic(p[1]!), meaning: cleanMeaning(p[2]!) };
  }
  return { arabic: cleaned, meaning: null };
}

function extractFromUnitText(unit: number, text: string): {
  entries: Entry[];
  ayahs: AyahEntry[];
} {
  const start =
    text.search(new RegExp(`یونٹ\\s*${unit}\\s*سبق\\s*1`, "u")) ?? -1;
  const body = start >= 0 ? text.slice(start) : text;
  const lines = body.split(/\r?\n/);
  const vocab = new Map<string, Entry>();
  const ayahMap = new Map<string, AyahEntry>();
  let inExercise = false;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (/^مشق/u.test(line)) {
      inExercise = true;
      continue;
    }
    if (/^یونٹ\s*\d+\s*سبق/u.test(line)) {
      inExercise = false;
    }
    if (/^سوال/u.test(line)) continue;

    // * arabic : urdu  OR  lemma : كَانَ/لَا form (urdu)
    const bullet = line.match(/^\*\s*(.+)$/u);
    if (bullet) {
      const parsed = parseLemmaColonLine(bullet[1]!);
      if (parsed) {
        if (parsed.formArabic && isParticleForm(parsed.formArabic)) {
          // إِلَّا / فِي / يَا … teach the form, not a false lemma gloss
          addEntry(vocab, unit, parsed.formArabic, parsed.meaning, ayahMap);
        } else {
          addEntry(vocab, unit, parsed.arabic, parsed.meaning, ayahMap);
          if (parsed.formArabic) {
            addEntry(vocab, unit, parsed.formArabic, parsed.meaning, ayahMap);
          }
        }
        continue;
      }
    }

    // arabic : urdu  OR  lemma : كَانَ/لَا form (urdu)
    const parsedColon = parseLemmaColonLine(line);
    if (parsedColon) {
      if (parsedColon.formArabic && isParticleForm(parsedColon.formArabic)) {
        addEntry(vocab, unit, parsedColon.formArabic, parsedColon.meaning, ayahMap);
      } else {
        addEntry(vocab, unit, parsedColon.arabic, parsedColon.meaning, ayahMap);
        if (parsedColon.formArabic) {
          addEntry(
            vocab,
            unit,
            parsedColon.formArabic,
            parsedColon.meaning,
            ayahMap,
          );
        }
      }
      continue;
    }

    // pipe cells with (meaning) — also lemma : form (urdu)
    if (line.includes("|") && /[（(]/.test(line)) {
      for (const part of line.split("|")) {
        const trimmed = part.trim();
        if (!trimmed) continue;
        const parsed = parseLemmaColonLine(trimmed);
        if (parsed) {
          if (parsed.formArabic && isParticleForm(parsed.formArabic)) {
            addEntry(vocab, unit, parsed.formArabic, parsed.meaning, ayahMap);
          } else {
            addEntry(vocab, unit, parsed.arabic, parsed.meaning, ayahMap);
            if (parsed.formArabic) {
              addEntry(vocab, unit, parsed.formArabic, parsed.meaning, ayahMap);
            }
          }
          continue;
        }
        const gloss = trimmed.match(
          /([^\s|（(:：]+(?:\s+[^\s|（(:：]+){0,5})\s*[（(]\s*([^)）]+)\s*[)）]/u,
        );
        if (gloss) addEntry(vocab, unit, gloss[1]!, gloss[2]!, ayahMap);
      }
      continue;
    }

    // arabic (urdu) alone
    const paren = line.match(
      /^([^\s（(]{2,}(?:\s+[^\s（(]+){0,6})\s*[（(]\s*([^)）]+)\s*[)）]\s*$/u,
    );
    if (paren && isArabicSurface(paren[1]!)) {
      addEntry(vocab, unit, paren[1]!, paren[2]!, ayahMap);
      continue;
    }

    // same-line: ARABIC URDU  (Unit 5 style lists) — keep simple to avoid backtracking
    if (!line.includes(":") && !line.includes("|") && line.length < 80) {
      const tokens = line.split(/\s+/);
      if (tokens.length >= 2) {
        let splitAt = -1;
        for (let i = 0; i < tokens.length; i += 1) {
          if (hasUrduLetters(tokens[i]!)) {
            splitAt = i;
            break;
          }
        }
        if (splitAt > 0) {
          const ar = tokens.slice(0, splitAt).join(" ");
          const ur = tokens.slice(splitAt).join(" ");
          if (isArabicSurface(ar) && looksLikeMeaning(ur)) {
            addEntry(vocab, unit, ar, ur, ayahMap);
            continue;
          }
        }
      }
    }

    // Quran chunks / ayahs — numbered, bulleted, parenthesized, or bare examples
    if (
      (isNumberedOrQuotedExample(line) || isBareQuranExampleLine(line)) &&
      looksLikeQuranChunk(line.replace(/^\*\s+/u, "").replace(/\s*[（(][^)）]+[)）]\s*$/u, ""))
    ) {
      const { arabic, meaning } = splitTrailingMeaning(
        line.replace(/^\*\s+/u, "").replace(/^[•●]\s*/u, ""),
      );
      // Skip vocab-like "arabic : urdu" leftovers and drills
      if (/[:：]/.test(arabic)) continue;
      if (tokenizeArabic(arabic).length < 2) continue;
      const key = normalizeArabic(arabic);
      if (!key || key.length < 6) continue;
      if (!ayahMap.has(key)) {
        ayahMap.set(key, {
          id: `u${unit}-ayah-${key.slice(0, 48)}`,
          unit,
          arabic,
          meaning,
        });
      } else if (meaning && !ayahMap.get(key)!.meaning) {
        ayahMap.get(key)!.meaning = meaning;
      }
      continue;
    }
  }

  return {
    entries: applyVocabGlossOverrides(unit, [...vocab.values()]),
    ayahs: [...ayahMap.values()],
  };
}

/** Match Muallim ة with mushaf ٰت / ات without turning اللہ into اللت. */
function mushafMatchKey(text: string): string {
  return normalizeArabic(text.replace(/ة/g, "ت"));
}

type MushafAyah = {
  ref: string;
  arabic: string;
  key: string;
  matchKey: string;
  words: Array<{ id: string; arabic: string }>;
  wordKeys: string[];
};

async function loadMushafAyahs(): Promise<MushafAyah[]> {
  const dir = path.join(process.cwd(), "data", "quran", "by-page");
  const files = await readdir(dir);
  const out: MushafAyah[] = [];
  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    const page = JSON.parse(
      await readFile(path.join(dir, file), "utf8"),
    ) as {
      ayahs: Array<{
        surahId: number;
        ayahNumber: number;
        text: string;
        words?: Array<{ id: string; arabic: string }>;
      }>;
    };
    for (const ayah of page.ayahs ?? []) {
      const arabic = ayah.text.trim();
      const words = (ayah.words ?? [])
        .map((w) => ({ id: w.id, arabic: w.arabic }))
        .filter((w) => {
          if (/^[ۖۗۘۙۚۛۜ۞۩]+$/u.test(w.arabic.trim())) return false;
          return mushafMatchKey(w.arabic).length > 0;
        });
      const wordKeys = words.map((w) => mushafMatchKey(w.arabic));
      out.push({
        ref: `${ayah.surahId}:${ayah.ayahNumber}`,
        arabic,
        key: normalizeArabic(arabic),
        matchKey: wordKeys.join(""),
        words,
        wordKeys,
      });
    }
  }
  return out;
}

async function loadWbwMeanings(): Promise<Record<string, string>> {
  try {
    const raw = await readFile(
      path.join(process.cwd(), "data", "quran", "wbw-urdu.json"),
      "utf8",
    );
    const json = JSON.parse(raw) as { meanings?: Record<string, string> };
    return json.meanings ?? {};
  } catch {
    return {};
  }
}

function stripLeadingConnective(key: string): string {
  if ((key.startsWith("و") || key.startsWith("ف")) && key.length > 3) {
    return key.slice(1);
  }
  return key;
}

function composePhraseFromWbw(
  arabic: string,
  mushaf: MushafAyah[],
  wbw: Record<string, string>,
): { meaning: string; ref: string } | null {
  const needles = [...new Set([normalizeArabic(arabic), mushafMatchKey(arabic)])].filter(
    (n) => n.length >= 6,
  );
  if (needles.length === 0) return null;

  for (const needle of needles) {
    for (const ayah of mushaf) {
      if (
        !ayah.matchKey.includes(needle) &&
        !ayah.matchKey.includes(`و${needle}`) &&
        !ayah.matchKey.includes(`ف${needle}`)
      ) {
        continue;
      }
      const wordKeys = ayah.wordKeys;
      for (let i = 0; i < wordKeys.length; i += 1) {
        for (let j = i; j < wordKeys.length; j += 1) {
          const slice = wordKeys.slice(i, j + 1);
          const joined = slice.join("");
          const joinedStrip =
            stripLeadingConnective(slice[0]!) + slice.slice(1).join("");
          if (joined !== needle && joinedStrip !== needle) {
            if (joined.length > needle.length + 1) break;
            continue;
          }
          const window = ayah.words.slice(i, j + 1);
          const parts = window
            .map((w) => wbw[w.id]?.replace(/\s+/g, " ").trim())
            .filter((p): p is string => Boolean(p));
          if (parts.length >= Math.max(1, window.length - 1) && parts.length > 0) {
            const meaning = parts
              .join(" ")
              .replace(/\s*[.۔]\s*/g, " ")
              .replace(/\s+/g, " ")
              .trim();
            if (looksLikeAyahMeaning(meaning)) {
              return { meaning, ref: ayah.ref };
            }
          }
        }
      }
    }
  }
  return null;
}

function enrichAyahMeanings(
  ayahs: AyahEntry[],
  mushaf: MushafAyah[],
  urduByRef: Map<string, string>,
  wbw: Record<string, string>,
): Array<AyahEntry & { ref?: string | null; number?: number }> {
  const byExact = new Map(mushaf.map((a) => [a.key, a]));

  const cleaned = ayahs.filter((item) => {
    if (!looksLikeQuranChunk(item.arabic)) return false;
    if (item.meaning && isNoiseMeaning(item.meaning, { maxLength: 40 })) {
      item.meaning = null;
    }
    return true;
  });

  let wbwHits = 0;
  let publishedHits = 0;

  const result = cleaned.map((item) => {
    const arabic = cleanArabic(item.arabic);
    let meaning = item.meaning;
    let ref: string | null = item.ref ?? null;

    // Prefer published WBW phrase composition whenever the Muallim gloss
    // is missing/truncated, or whenever WBW yields a clearer full gloss.
    const wbwHit = composePhraseFromWbw(arabic, mushaf, wbw);
    if (wbwHit) {
      ref = wbwHit.ref;
      if (
        !meaning ||
        isIncompletePhraseMeaning(arabic, meaning) ||
        preferMeaning(meaning, wbwHit.meaning, arabic) === wbwHit.meaning
      ) {
        meaning = wbwHit.meaning;
        wbwHits += 1;
      }
    }

    if (meaning && looksLikeAyahMeaning(meaning) && !isIncompletePhraseMeaning(arabic, meaning)) {
      return { ...item, arabic, meaning, ref };
    }

    const key = normalizeArabic(arabic);
    if (!key || key.length < 10) {
      return { ...item, arabic, meaning, ref };
    }

    const exact = byExact.get(key);
    if (exact) {
      ref = exact.ref;
      const ur = urduByRef.get(exact.ref);
      if (ur && looksLikeAyahMeaning(ur)) {
        publishedHits += 1;
        return { ...item, arabic, meaning: ur, ref };
      }
      return { ...item, arabic, meaning, ref };
    }

    if (key.length < 20) return { ...item, arabic, meaning, ref };
    let best: MushafAyah | null = null;
    for (const a of mushaf) {
      if (a.key.length > key.length * 1.35) continue;
      if (!a.key.includes(key) && !key.includes(a.key)) continue;
      if (!best || a.key.length < best.key.length) best = a;
    }
    if (best && key.length >= best.key.length * 0.7) {
      ref = best.ref;
      const ur = urduByRef.get(best.ref);
      if (ur && looksLikeAyahMeaning(ur)) {
        publishedHits += 1;
        return { ...item, arabic, meaning: ur, ref };
      }
      return { ...item, arabic, meaning, ref };
    }
    return { ...item, arabic, meaning, ref };
  });

  console.log(`wbw phrase meanings: ${wbwHits}; published ayah fills: ${publishedHits}`);
  return result;
}

async function loadPublishedAyahUrdu(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  try {
    const res = await fetch("https://api.alquran.cloud/v1/quran/ur.jalandhry", {
      headers: { "User-Agent": "quran-learning-app" },
    });
    if (!res.ok) return map;
    const json = (await res.json()) as {
      data?: {
        surahs?: Array<{
          number: number;
          ayahs: Array<{ number: number; text: string }>;
        }>;
      };
    };
    for (const surah of json.data?.surahs ?? []) {
      for (const ayah of surah.ayahs ?? []) {
        const ayahNumber =
          (ayah as { numberInSurah?: number }).numberInSurah ?? ayah.number;
        const text = ayah.text.replace(/^\uFEFF/, "").trim();
        if (text) {
          map.set(`${surah.number}:${ayahNumber}`, text);
        }
      }
    }
  } catch {
    // optional enrichment
  }
  return map;
}

/** Fill remaining gaps from alquran.cloud search + ur.jalandhry / WBW (published sources). */
async function fillMissingMeaningsFromInternet(
  ayahs: Array<AyahEntry & { ref?: string | null }>,
  urduByRef: Map<string, string>,
  mushaf: MushafAyah[],
  wbw: Record<string, string>,
): Promise<Array<AyahEntry & { ref?: string | null }>> {
  const missing = ayahs
    .filter(
      (a) =>
        (!a.meaning || isIncompletePhraseMeaning(a.arabic, a.meaning)) &&
        tokenizeArabic(a.arabic).length >= 3 &&
        a.arabic.length >= 14,
    )
    .sort((a, b) => b.arabic.length - a.arabic.length)
    .slice(0, 2000);
  console.log(`internet fill candidates: ${missing.length}`);

  const byRef = new Map(mushaf.map((a) => [a.ref, a]));
  const concurrency = 6;
  let cursor = 0;

  async function worker() {
    while (cursor < missing.length) {
      const index = cursor;
      cursor += 1;
      const item = missing[index]!;
      try {
        const q = encodeURIComponent(cleanArabic(item.arabic));
        const res = await fetch(
          `https://api.alquran.cloud/v1/search/${q}/all/quran-uthmani`,
          { headers: { "User-Agent": "quran-learning-app" } },
        );
        if (!res.ok) continue;
        const json = (await res.json()) as {
          data?: {
            matches?: Array<{
              surah?: { number?: number };
              numberInSurah?: number;
            }>;
          };
        };
        const hit = json.data?.matches?.[0];
        const surah = hit?.surah?.number;
        const ayah = hit?.numberInSurah;
        if (!surah || !ayah) continue;
        const ref = `${surah}:${ayah}`;
        item.ref = ref;

        const local = byRef.get(ref);
        if (local) {
          const composed = composePhraseFromWbw(item.arabic, [local], wbw);
          if (composed && looksLikeAyahMeaning(composed.meaning)) {
            item.meaning = composed.meaning;
            continue;
          }
        }

        // Only use full-ayah Urdu when the chunk is nearly the whole ayah
        const ur = urduByRef.get(ref);
        const chunkKey = mushafMatchKey(item.arabic);
        const ayahKey = local?.matchKey ?? "";
        if (
          ur &&
          looksLikeAyahMeaning(ur) &&
          ayahKey &&
          chunkKey.length >= ayahKey.length * 0.75
        ) {
          item.meaning = ur;
        }
      } catch {
        // skip
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, Math.max(missing.length, 1)) }, () =>
      worker(),
    ),
  );
  return ayahs;
}

async function main() {
  const allEntries: Entry[] = [];
  const allAyahs: AyahEntry[] = [];

  for (const unit of UNITS) {
    const file = path.join(
      process.cwd(),
      "knowledge",
      "books",
      "original",
      `Unit ${unit}.txt`,
    );
    const text = await readFile(file, "utf8");
    const { entries, ayahs } = extractFromUnitText(unit, text);
    allEntries.push(...entries);
    allAyahs.push(...ayahs);
    console.log(
      `unit ${unit}: words=${entries.filter((e) => e.kind === "word").length} phrases=${entries.filter((e) => e.kind === "phrase").length} ayahs=${ayahs.length}`,
    );
  }

  const byUnit = UNITS.map((unit) => {
    const items = allEntries
      .filter((e) => e.unit === unit)
      .filter((e) => looksLikeMeaning(e.meaning) && isArabicSurface(e.arabic))
      .sort((a, b) => {
        if (a.kind !== b.kind) return a.kind === "word" ? -1 : 1;
        return a.arabic.localeCompare(b.arabic, "ar");
      });
    return {
      unit,
      wordCount: items.filter((i) => i.kind === "word").length,
      phraseCount: items.filter((i) => i.kind === "phrase").length,
      words: items,
    };
  });

  const vocabOut = {
    version: 2,
    builtAt: new Date().toISOString(),
    source: "knowledge/books/original/Unit 1–7.txt",
    note: "Muallim words and common phrases with meanings — extracted from TXT only.",
    units: byUnit,
    totalWords: byUnit.reduce((s, u) => s + u.wordCount, 0),
    totalPhrases: byUnit.reduce((s, u) => s + u.phraseCount, 0),
  };

  const mushaf = await loadMushafAyahs();
  const urduByRef = await loadPublishedAyahUrdu();
  const wbw = await loadWbwMeanings();
  console.log(
    `urdu ayah translations loaded: ${urduByRef.size}; wbw words: ${Object.keys(wbw).length}`,
  );
  let enriched = enrichAyahMeanings(allAyahs, mushaf, urduByRef, wbw);
  enriched = await fillMissingMeaningsFromInternet(
    enriched,
    urduByRef,
    mushaf,
    wbw,
  );

  // Keep only clean chunks that have a real Urdu meaning (no empty placeholders)
  enriched = enriched.filter((a) => {
    if (!looksLikeQuranChunk(a.arabic)) return false;
    if (!a.meaning || !looksLikeAyahMeaning(a.meaning)) {
      return false;
    }
    // Drop still-truncated Muallim paren glosses that we could not enrich
    if (isIncompletePhraseMeaning(a.arabic, a.meaning)) {
      return false;
    }
    return true;
  });

  const ayahUnits = UNITS.map((unit) => {
    const items = enriched
      .filter((a) => a.unit === unit)
      .sort((a, b) => a.arabic.localeCompare(b.arabic, "ar"))
      .map((a, index) => ({
        ...a,
        number: index + 1,
      }));
    return {
      unit,
      ayahCount: items.length,
      withMeaning: items.filter((a) => Boolean(a.meaning)).length,
      ayahs: items,
    };
  });

  const ayahOut = {
    version: 3,
    builtAt: new Date().toISOString(),
    source:
      "Muallim TXT chunks; incomplete glosses completed from quranwbw Urdu WBW (same as mushaf reader); full-ayah gaps from ur.jalandhry",
    note: "Numbered per unit. Prefer complete phrase meanings (WBW composition) over truncated Muallim parentheses.",
    units: ayahUnits,
    totalAyahs: ayahUnits.reduce((s, u) => s + u.ayahCount, 0),
    withMeaning: ayahUnits.reduce((s, u) => s + u.withMeaning, 0),
  };

  const dir = path.join(process.cwd(), "data", "curriculum");
  await mkdir(dir, { recursive: true });
  await writeFile(
    path.join(dir, "unit-vocabulary.json"),
    JSON.stringify(vocabOut, null, 2),
    "utf8",
  );
  await writeFile(
    path.join(dir, "unit-ayahs.json"),
    JSON.stringify(ayahOut, null, 2),
    "utf8",
  );

  console.log(
    JSON.stringify(
      {
        totalWords: vocabOut.totalWords,
        totalPhrases: vocabOut.totalPhrases,
        totalAyahs: ayahOut.totalAyahs,
        byUnit: Object.fromEntries(
          byUnit.map((u) => [
            u.unit,
            { words: u.wordCount, phrases: u.phraseCount },
          ]),
        ),
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
