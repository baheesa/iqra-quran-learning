/**
 * Deterministic Muallim TXT curriculum extractor.
 * Reads only what is written in the transcript — never invents meanings.
 */

import type { ExtractionOutput } from "@/features/knowledge/providers/types";
import { normalizeArabic } from "@/features/teacher/domain/arabic";

export type TxtExtractContext = {
  unitNumber: number | null;
  pageLabel: string | null;
  pageNumber: number;
};

const ARABIC_TOKEN =
  /[\u0621-\u064A\u066E\u066F\u0671-\u06D3\u06FA-\u06FF\u064B-\u065F\u0670\u06D6-\u06ED]+/u;

function hasArabic(text: string): boolean {
  return /[\u0621-\u064A]/u.test(text);
}

function hasUrduScript(text: string): boolean {
  // Urdu often shares Arabic letters; treat as Urdu gloss if it contains
  // common Urdu-only letters or is mostly non-tashkeel prose after a colon/paren.
  return /[\u0679\u067E\u0686\u0688\u0691\u06A9\u06AF\u06BE\u06C1\u06C3\u06D2]/u.test(
    text,
  ) || /[\u0600-\u06FF]/u.test(text);
}

function cleanArabic(value: string): string {
  return value
    .replace(/^[*\d.\-)\s]+/u, "")
    .replace(/[)）\]】]+$/u, "")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanMeaning(value: string): string {
  return value
    .replace(/^[（(\s]+|[）)\s]+$/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseUnitLesson(text: string): {
  unit: number | null;
  lesson: number | null;
  title: string | null;
} {
  const unitLesson = text.match(/یونٹ\s*(\d+)\s*سبق\s*(\d+)/u);
  if (unitLesson) {
    return {
      unit: Number(unitLesson[1]),
      lesson: Number(unitLesson[2]),
      title: `یونٹ ${unitLesson[1]} سبق ${unitLesson[2]}`,
    };
  }
  const unitOnly = text.match(/یونٹ\s*(\d+)/u);
  if (unitOnly) {
    return {
      unit: Number(unitOnly[1]),
      lesson: null,
      title: `یونٹ ${unitOnly[1]}`,
    };
  }
  return { unit: null, lesson: null, title: null };
}

function looksLikeQuranLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length < 8) return false;
  if (!hasArabic(trimmed)) return false;
  // Numbered examples: "1. ARABIC" or "53. ARABIC"
  if (/^\d{1,3}[.\)]\s*/u.test(trimmed)) return true;
  // Mostly Arabic tokens (verse-like)
  const arabicChars = (trimmed.match(/[\u0621-\u064A]/gu) ?? []).length;
  const latin = (trimmed.match(/[A-Za-z]/g) ?? []).length;
  return arabicChars >= 12 && arabicChars > latin * 3;
}

type VocabDraft = {
  arabic: string;
  urdu: string;
  root: string | null;
  grammar: string | null;
  references: string[];
};

function attachReferenceToMatchingVocab(
  map: Map<string, VocabDraft>,
  ref: string,
): void {
  const refKey = normalizeArabic(ref);
  if (!refKey) return;
  for (const [key, draft] of map) {
    if (key.length < 3) continue;
    if (refKey.includes(key) && !draft.references.includes(ref)) {
      draft.references.push(ref);
    }
  }
}

function addVocab(
  map: Map<string, VocabDraft>,
  arabicRaw: string,
  urduRaw: string,
  extras?: { root?: string | null; grammar?: string | null; reference?: string },
): void {
  const arabic = cleanArabic(arabicRaw);
  const urdu = cleanMeaning(urduRaw);
  if (!arabic || !urdu || !hasArabic(arabic)) return;
  // Skip Urdu prose wrongly captured as "arabic"
  if (/[ےھٹڈڑںگچپ]/.test(arabic)) return;
  // Skip transform drills and dotted letter lists
  if (/->|→/.test(arabic) || /\s-\s/.test(arabic)) return;
  // Skip page-number "meanings"
  if (/^\d+([،,\s]+\d+)*\.?$/.test(urdu)) return;
  // Skip if "meaning" is still only Arabic (no educational Urdu gloss)
  if (!hasUrduScript(urdu) && normalizeArabic(urdu) === normalizeArabic(arabic)) {
    return;
  }
  // Prefer entries that have clear Urdu letters; allow mixed glosses like "بیشک الله"
  const key = normalizeArabic(arabic);
  if (!key) return;

  const existing = map.get(key);
  const next: VocabDraft = {
    arabic,
    urdu,
    root: extras?.root ?? existing?.root ?? null,
    grammar: extras?.grammar ?? existing?.grammar ?? null,
    references: [...(existing?.references ?? [])],
  };
  if (extras?.reference) {
    const ref = cleanArabic(extras.reference);
    if (ref && !next.references.includes(ref)) {
      next.references.push(ref);
    }
  }
  // Prefer shorter clean word glosses over long sentence demos
  const preferNext =
    !existing ||
    (urdu.length <= 48 &&
      (existing.urdu.length > urdu.length ||
        (/->/.test(existing.arabic) && !/->/.test(arabic))));
  if (preferNext) {
    map.set(key, { ...next, references: next.references.length ? next.references : existing?.references ?? [] });
  } else if (extras?.reference) {
    existing.references = next.references;
  }
}

/**
 * Extract structured curriculum fields from one TXT section body.
 */
export function extractFromTxtSection(
  text: string,
  context: TxtExtractContext,
): ExtractionOutput {
  const lines = text.split(/\r?\n/);
  const vocabMap = new Map<string, VocabDraft>();
  const rules: ExtractionOutput["rules"] = [];
  const exercises: ExtractionOutput["exercises"] = [];
  const examples: string[] = [];
  const reviewQuestions: string[] = [];
  const headings: string[] = [];
  const references: string[] = [];

  let meta = parseUnitLesson(text);
  if (meta.unit == null && context.unitNumber != null) {
    meta = { ...meta, unit: context.unitNumber };
  }

  let lastVocabKey: string | null = null;
  let inExercise = false;
  let pendingRuleExamples: string[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i] ?? "";
    const line = raw.trim();
    if (!line) continue;

    const lessonHit = parseUnitLesson(line);
    if (lessonHit.unit != null) {
      meta = {
        unit: lessonHit.unit,
        lesson: lessonHit.lesson ?? meta.lesson,
        title: lessonHit.title ?? meta.title,
      };
      if (lessonHit.title) headings.push(lessonHit.title);
    }

    if (/^مشق/u.test(line)) {
      inExercise = true;
      continue;
    }

    // Unit 1 style: * الإسلام  : اسلام
    const bullet = line.match(
      /^\*\s*(.+?)\s*[:：]\s*(.+)$/u,
    );
    if (bullet) {
      const left = bullet[1]!.trim();
      const right = bullet[2]!.trim();
      if (hasArabic(left) && right) {
        addVocab(vocabMap, left, right);
        lastVocabKey = normalizeArabic(left);
      }
      continue;
    }

    // Stem : form (meaning)  — يَرْجُو : يَرْجُونَ (وہ امید رکھتے ہیں)
    const stemForm = line.match(
      /^([^\s:：|]+)\s*[:：]\s*([^\s:：|(（]+)(?:\s*[（(]\s*([^)）]+)\s*[)）])?\s*$/u,
    );
    if (stemForm && hasArabic(stemForm[1]!) && hasArabic(stemForm[2]!)) {
      const stem = stemForm[1]!;
      const form = stemForm[2]!;
      const meaning = stemForm[3] ? cleanMeaning(stemForm[3]) : "";
      if (meaning) {
        addVocab(vocabMap, form, meaning, {
          root: cleanArabic(stem),
          grammar: "فعل حال — جمع",
        });
        addVocab(vocabMap, stem, meaning, { grammar: "فعل حال — مفرد" });
        lastVocabKey = normalizeArabic(form);
      }
      continue;
    }

    // Pipe-separated glosses: يَرْجُونَ (وہ امید رکھتے ہیں) | يَخَافُونَ (وہ ڈرتے ہیں)
    if (line.includes("|") && /[（(]/.test(line)) {
      const parts = line.split("|");
      for (const part of parts) {
        const gloss = part.match(
          /([^\s|（(]+)\s*[（(]\s*([^)）]+)\s*[)）]/u,
        );
        if (gloss) {
          addVocab(vocabMap, gloss[1]!, gloss[2]!);
          lastVocabKey = normalizeArabic(gloss[1]!);
        }
      }
      continue;
    }

    // arabic (urdu) on a short line
    const parenOnly = line.match(
      /^([^\s（(]{2,})\s*[（(]\s*([^)）]+)\s*[)）]\s*$/u,
    );
    if (parenOnly && hasArabic(parenOnly[1]!)) {
      addVocab(vocabMap, parenOnly[1]!, parenOnly[2]!);
      lastVocabKey = normalizeArabic(parenOnly[1]!);
      continue;
    }

    // Transform drills: keep as examples only — do not attach sentence glosses to word keys
    const arrow = line.match(
      /^(.+?)\s*->\s*(.+?)(?:\s*[（(]\s*([^)）]+)\s*[)）])?\s*$/u,
    );
    if (arrow && hasArabic(arrow[2]!)) {
      examples.push(line);
      const right = cleanArabic(arrow[2]!);
      const gloss = arrow[3] ? cleanMeaning(arrow[3]) : "";
      // Only accept when RHS is a single token with a short paren gloss (not "یہ … ہے")
      const rightTokens = right.match(new RegExp(ARABIC_TOKEN.source, "gu")) ?? [];
      if (
        gloss &&
        rightTokens.length === 1 &&
        gloss.length <= 40 &&
        !/^(یہ|وہ|تم)\s/u.test(gloss)
      ) {
        addVocab(vocabMap, rightTokens[0]!, gloss);
        lastVocabKey = normalizeArabic(rightTokens[0]!);
      }
      continue;
    }

    // Urdu meaning line for previous Arabic transform: کتاب -> بیشک کتاب
    const urduArrow = line.match(/^(.+?)\s*->\s*(.+)$/u);
    if (urduArrow && !hasArabic(urduArrow[1]!) && hasUrduScript(urduArrow[1]!)) {
      // Keep as example/context only — left side is Urdu lemma, not Quran token
      examples.push(line);
      continue;
    }

    // Rule prose
    if (
      /واضح ہے کہ|کا مطلب|معنی[:：]|مطلب ہے|استعمال ہوتا/u.test(line) &&
      line.length > 20
    ) {
      const titleMatch =
        line.match(/[（(]([^)）]+)[)）]/u) ??
        line.match(/إِنَّ|لِـ|فِي|بِـ|لَا|كَانَ/u);
      const title = titleMatch
        ? `قاعدہ: ${Array.isArray(titleMatch) ? titleMatch[1] ?? titleMatch[0] : titleMatch[0]}`
        : `قاعدہ — صفحہ ${context.pageLabel ?? context.pageNumber}`;
      rules.push({
        title: title.slice(0, 120),
        explanation: line,
        examples: [...pendingRuleExamples],
        lesson: meta.lesson,
        unit: meta.unit,
        confidence: 1,
      });
      pendingRuleExamples = [];
      continue;
    }

    // Exercises / questions
    if (/^سوال/u.test(line) || inExercise) {
      if (/^سوال/u.test(line) || /^\d+[.\)]\s*/u.test(line)) {
        exercises.push({
          question: line.replace(/^سوال\s*[۰-۹0-9]*\s*[:：]?\s*/u, "").trim() || line,
          answer: null,
          exerciseType: inExercise ? "مشق" : "سوال",
          lesson: meta.lesson,
          unit: meta.unit,
          difficulty: null,
          confidence: 1,
        });
        reviewQuestions.push(line);
      }
      if (looksLikeQuranLine(line)) {
        const ref = cleanArabic(line.replace(/^\d+[.\)]\s*/u, ""));
        if (ref) {
          references.push(ref);
          attachReferenceToMatchingVocab(vocabMap, ref);
          if (lastVocabKey) {
            const draft = vocabMap.get(lastVocabKey);
            if (draft && !draft.references.includes(ref)) {
              draft.references.push(ref);
            }
          }
        }
      }
      continue;
    }

    // Numbered Quran examples after a vocab heading
    if (looksLikeQuranLine(line)) {
      const ref = cleanArabic(line.replace(/^\d+[.\)]\s*/u, ""));
      if (ref) {
        references.push(ref);
        examples.push(ref);
        pendingRuleExamples.push(ref);
        attachReferenceToMatchingVocab(vocabMap, ref);
        if (lastVocabKey) {
          const draft = vocabMap.get(lastVocabKey);
          if (draft && !draft.references.includes(ref)) {
            draft.references.push(ref);
          }
        }
      }
    }
  }

  const lessons: ExtractionOutput["lessons"] = [];
  if (meta.title || meta.lesson != null || vocabMap.size > 0) {
    lessons.push({
      title: meta.title ?? `صفحہ ${context.pageLabel ?? context.pageNumber}`,
      lessonNumber: meta.lesson,
      unit: meta.unit ?? context.unitNumber,
      objectives: headings.slice(0, 5),
      confidence: 1,
    });
  }

  const vocabulary: ExtractionOutput["vocabulary"] = [...vocabMap.values()].map(
    (item) => ({
      arabic: item.arabic,
      urdu: item.urdu,
      lesson: meta.lesson,
      unit: meta.unit ?? context.unitNumber,
      confidence: 1,
      root: item.root,
      grammar: item.grammar,
      references: item.references,
      difficulty: null,
    }),
  );

  return {
    provider: "txt-structure",
    lessons,
    vocabulary,
    rules,
    exercises,
    examples: examples.slice(0, 40),
    reviewQuestions: reviewQuestions.slice(0, 40),
    headings,
    tables: [],
    quranReferences: references.slice(0, 80),
  };
}
