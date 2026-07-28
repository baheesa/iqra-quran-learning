import type {
  ExtractedLessonItem,
  ExtractedRuleItem,
  ExtractedVocabularyItem,
  KnowledgeExportBundle,
} from "@/features/knowledge/types";
import {
  arabicLookupCandidates,
  normalizeArabic,
} from "@/features/teacher/domain/arabic";

export type VocabularyIndexEntry = {
  word: string;
  arabic: string;
  meaning: string;
  root: string | null;
  lesson: string | null;
  unit: number | null;
  grammar: string | null;
  rule: string | null;
  explanation: string | null;
  references: string[];
  difficulty: number | null;
  occurrences: number;
  page: number | null;
  bookSlug: string;
  vocabularyId: string;
};

export type VocabularyIndexFile = {
  version: 1;
  builtAt: string;
  entryCount: number;
  /** Normalized Arabic key → entry */
  entries: Record<string, VocabularyIndexEntry>;
};

export type KnowledgeLookupResult = {
  found: boolean;
  word: string;
  meaning: string | null;
  arabic: string | null;
  root: string | null;
  lesson: string | null;
  unit: number | null;
  grammar: string | null;
  rule: string | null;
  explanation: string | null;
  references: string[];
  difficulty: number | null;
  occurrences: number | null;
  page: number | null;
  bookSlug: string | null;
  vocabularyId: string | null;
  source: "muallim_approved" | null;
  message: string | null;
};

export const UNKNOWN_WORD_MESSAGE =
  "اس لفظ کی وضاحت ابھی علم کے ذخیرے میں موجود نہیں۔";

export function tokenizeArabicPhrase(arabic: string): string[] {
  return arabic
    .split(/[\s\u060C\u061B،,؛;./]+/u)
    .map((part) => part.trim())
    .filter((part) => part.length > 0 && isArabicScriptToken(part));
}

/** True when the string is Arabic script (not Urdu prose mixed into the arabic field). */
export function isArabicScriptToken(text: string): boolean {
  const letters = [...text].filter((char) => /\p{L}/u.test(char));
  if (letters.length === 0) return false;
  if (/[ےھٹڈڑںگچپ]/.test(text)) return false;
  const arabicLetters = letters.filter((char) =>
    /[\u0600-\u06FF]/.test(char),
  );
  return arabicLetters.length === letters.length;
}

/**
 * Only clean single-word Muallim glosses belong in the Quran click index.
 * Multi-word demos, transforms, and page-number "meanings" are rejected.
 */
export function isIndexableWordGloss(arabic: string, meaning: string): boolean {
  const a = arabic.trim();
  const m = meaning.trim();
  if (!a || !m) return false;
  if (/[ےھٹڈڑںگچپ]/.test(a)) return false;
  if (/->|→/.test(a)) return false;
  if (/[.*_|+]/.test(a)) return false;
  if (/^\d+([،,\s]+\d+)*\.?$/.test(m)) return false;
  if (m.length < 2 || m.length > 48) return false;
  // Urdu glosses don't carry Arabic tashkeel — those are conjugation dumps
  if (/[\u064B-\u065F\u0670]/.test(m)) return false;

  const tokens = tokenizeArabicPhrase(a);
  if (tokens.length !== 1) return false;
  if (!isArabicScriptToken(tokens[0]!)) return false;

  // Sentence demos from هو/هذا drills — not a word gloss
  if (/^(یہ|تم)\s+.+/u.test(m) && /(?:ہے|ہیں)\.?$/u.test(m)) {
    return false;
  }
  if (/^وہ\s+.+(ہے)\.?$/u.test(m)) return false;
  if (/^اور\s/u.test(m) && m.length > 18) return false;
  if (/معاف کرتا|کیوں نہیں|مؤنث کا/u.test(m)) return false;

  return true;
}

/** Higher is better — used when several glosses collide on one key. */
export function glossQualityScore(entry: {
  arabic: string;
  meaning: string;
}): number {
  let score = 0;
  const tokens = tokenizeArabicPhrase(entry.arabic);
  if (tokens.length === 1) score += 60;
  else score -= 40;
  if (/->|→/.test(entry.arabic)) score -= 120;
  if (/[ےھٹڈڑںگچپ]/.test(entry.arabic)) score -= 120;
  if (/^\d/.test(entry.meaning)) score -= 120;
  score += Math.max(0, 36 - entry.meaning.length);
  if (/^(یہ|وہ|تم)\s/u.test(entry.meaning)) score -= 25;
  if (/^اور\s/u.test(entry.meaning)) score -= 20;
  if (/(?:ہے|ہیں)\.?$/u.test(entry.meaning) && entry.meaning.length > 10) {
    score -= 15;
  }
  // Prefer lemma closer to a single normalized token
  score += Math.max(0, 12 - normalizeArabic(entry.arabic).length);
  return score;
}

function resolveLessonTitle(
  vocab: ExtractedVocabularyItem,
  lessons: ExtractedLessonItem[],
): string | null {
  const match =
    lessons.find(
      (item) =>
        item.lessonNumber === vocab.lesson ||
        item.page === vocab.page ||
        item.pageNumber === vocab.pageNumber ||
        item.id === String(vocab.lesson),
    ) ?? lessons.find((item) => item.unit === vocab.unit);

  if (match?.title) {
    return match.title;
  }
  if (vocab.unit != null && vocab.lesson != null) {
    return `Unit ${vocab.unit} سبق ${vocab.lesson}`;
  }
  if (vocab.unit != null) {
    return `Unit ${vocab.unit}`;
  }
  return null;
}

function resolveRule(
  vocab: ExtractedVocabularyItem,
  rules: ExtractedRuleItem[],
): ExtractedRuleItem | null {
  return (
    rules.find(
      (item) =>
        item.page === vocab.page ||
        item.pageNumber === vocab.pageNumber ||
        item.lesson === vocab.lesson ||
        item.unit === vocab.unit,
    ) ?? null
  );
}

/** Index keys for a single clean lemma only — never split phrases onto sibling words. */
function indexKeysForArabic(arabic: string): string[] {
  if (/[ےھٹڈڑںگچپ]/.test(arabic) || /->|→/.test(arabic)) return [];
  const tokens = tokenizeArabicPhrase(arabic);
  if (tokens.length !== 1) return [];

  const keys = new Set<string>();
  for (const key of arabicLookupCandidates(tokens[0]!)) {
    if (key) keys.add(key);
  }
  return [...keys];
}

function preferEntry(
  existing: VocabularyIndexEntry,
  next: VocabularyIndexEntry,
): VocabularyIndexEntry {
  const mergedRefs = [...new Set([...existing.references, ...next.references])];
  const base =
    glossQualityScore(next) > glossQualityScore(existing) ? next : existing;

  return {
    ...base,
    references: mergedRefs,
    root: base.root ?? existing.root ?? next.root,
    grammar: base.grammar ?? existing.grammar ?? next.grammar,
    rule: base.rule ?? existing.rule ?? next.rule,
    occurrences: existing.occurrences + 1,
  };
}

/**
 * Build vocabulary index from approved export bundles.
 * Only clean single-word glosses — never invent meanings.
 */
export function buildVocabularyIndexFromBundles(
  bundles: KnowledgeExportBundle[],
): VocabularyIndexFile {
  const entries: Record<string, VocabularyIndexEntry> = {};

  for (const bundle of bundles) {
    for (const vocab of bundle.vocabulary) {
      if (!vocab.arabic?.trim()) continue;
      const meaning = (vocab.urdu ?? "").trim();
      if (!isIndexableWordGloss(vocab.arabic, meaning)) continue;

      const rule = resolveRule(vocab, bundle.rules);
      const base: VocabularyIndexEntry = {
        word: vocab.arabic,
        arabic: vocab.arabic,
        meaning,
        root: vocab.root ?? null,
        lesson: resolveLessonTitle(vocab, bundle.lessons),
        unit: vocab.unit,
        grammar: vocab.grammar ?? null,
        rule: rule?.title ?? null,
        explanation: rule?.explanation ?? null,
        references: vocab.references ?? [],
        difficulty: vocab.difficulty ?? null,
        occurrences: 1,
        page: vocab.page ?? vocab.pageNumber ?? null,
        bookSlug: vocab.bookSlug || bundle.bookSlug,
        vocabularyId: vocab.id,
      };

      for (const key of indexKeysForArabic(vocab.arabic)) {
        const existing = entries[key];
        entries[key] = existing ? preferEntry(existing, base) : { ...base };
      }
    }
  }

  return {
    version: 1,
    builtAt: new Date().toISOString(),
    entryCount: Object.keys(entries).length,
    entries,
  };
}

export function lookupInIndex(
  index: VocabularyIndexFile,
  word: string,
): VocabularyIndexEntry | null {
  let best: VocabularyIndexEntry | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const key of arabicLookupCandidates(word)) {
    const hit = index.entries[key];
    if (!hit) continue;
    if (!isIndexableWordGloss(hit.arabic, hit.meaning)) continue;

    let score = glossQualityScore(hit);
    const hitNorm = normalizeArabic(hit.arabic);
    if (hitNorm === key) score += 25;
    if (arabicLookupCandidates(hit.arabic)[0] === key) score += 10;

    if (score > bestScore) {
      best = hit;
      bestScore = score;
    }
  }

  // Honest miss when the only hits are low-quality leftovers
  if (!best || bestScore < 20) return null;
  return best;
}

export function toLookupResult(
  word: string,
  hit: VocabularyIndexEntry | null,
): KnowledgeLookupResult {
  const trimmed = word.trim();
  if (!hit) {
    return {
      found: false,
      word: trimmed,
      meaning: null,
      arabic: null,
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
    };
  }

  return {
    found: true,
    word: trimmed,
    meaning: hit.meaning,
    arabic: hit.arabic,
    root: hit.root,
    lesson: hit.lesson,
    unit: hit.unit,
    grammar: hit.grammar,
    rule: hit.rule,
    explanation: hit.explanation,
    references: hit.references,
    difficulty: hit.difficulty,
    occurrences: hit.occurrences,
    page: hit.page,
    bookSlug: hit.bookSlug,
    vocabularyId: hit.vocabularyId,
    source: "muallim_approved",
    message: null,
  };
}

/** API-shaped payload for GET /api/v1/knowledge/lookup */
export function toLookupApiPayload(result: KnowledgeLookupResult) {
  return {
    word: result.word,
    found: result.found,
    arabic: result.arabic,
    meaning: result.meaning,
    root: result.root,
    lesson: result.lesson,
    unit: result.unit,
    grammar: result.grammar,
    rule: result.rule,
    explanation: result.explanation,
    references: result.references,
    difficulty: result.difficulty,
    occurrences: result.occurrences,
    page: result.page,
    bookSlug: result.bookSlug,
    vocabularyId: result.vocabularyId,
    source: result.source,
    message: result.message,
  };
}
