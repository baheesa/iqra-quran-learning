/**
 * Distill brief Muallim learner rules from Unit TXT files.
 * Definitions follow the book — no invented curriculum.
 */
import { mkdir, readFile, readdir, writeFile } from "fs/promises";
import path from "path";

export type DistilledRule = {
  id: string;
  unit: number;
  order: number;
  title: string;
  definition: string;
};

const ORIGINAL_DIR = path.join(process.cwd(), "knowledge/books/original");
const OUT_FILE = path.join(
  process.cwd(),
  "knowledge/books/exports/learner-rules.json",
);

function unitFromFilename(name: string): number | null {
  const match = name.match(/Unit\s*(\d+)/i);
  return match ? Number(match[1]) : null;
}

function cleanText(value: string): string {
  return value
    .replace(/^["“”«'\s]+|["“”»'\s]+$/gu, "")
    .replace(/[()（）]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanGloss(value: string): string {
  return cleanText(value)
    .replace(/\s*ہے\s*$/u, "")
    .replace(/\s*ہو\s*گا\s*$/u, "")
    .trim();
}

function isNoiseLine(line: string): boolean {
  const t = line.trim();
  if (!t || t.length < 20) return true;
  if (/^سوال|^س\s*\d/u.test(t)) return true;
  if (
    /ہر لفظ کے سامنے|ترجمہ کریں|ترجمہ کیجئے|ہائی لائٹ|مطلب بتائیں|مطلب بتائیے|مطلب لکھ|دورو ہو کر|دو دو ہو کر/u.test(
      t,
    )
  ) {
    return true;
  }
  return false;
}

function extractPair(line: string): { title: string; gloss: string } | null {
  const patterns: RegExp[] = [
    /واضح ہے کہ\s*[（(]\s*([^)）]+?)\s*[)）]\s*کا\s*(?:عربی زبان میں\s*)?(?:مطلب|معنی)\s*[:：]?\s*[（("'«“]?([^)）"'»”\n۔]+)[)）"'»”]?/u,
    /واضح ہے کہ\s*عربی زبان میں\s*[（(]?\s*([^)）،,]{1,30}?)\s*[)）]?\s*(?:کے آخر میں|لگنے سے|کا مطلب|کا معنی)/u,
    /(?:معنی|مفہوم)\s*[:：]\s*[（(]\s*([^)）]+?)\s*[)）]\s*کا\s*مطلب\s*[（("'«“]?([^)）"'»”\n۔]+)[)）"'»”]?/u,
    /عربی زبان میں\s*[（(]\s*([^)）]+?)\s*[)）]\s*کا\s*(?:مطلب|معنی)\s*[（("'«“]?([^)）"'»”\n۔]+)[)）"'»”]?/u,
    /[（(]\s*([^)）]{1,28})\s*[)）]\s*کا\s*(?:مطلب|معنی)\s*[（("'«“]?([^)）"'»”\n۔]{1,70})[)）"'»”]?/u,
    /^([\u0621-\u064A\u0671\u06CC\u064B-\u065F\u0670ـ]{2,20})\s*کا\s*(?:مطلب|معنی)\s*[（("'«“]?([^)）"'»”\n۔]{1,70})[)）"'»”]?/u,
  ];

  for (const pattern of patterns) {
    const match = line.match(pattern);
    if (!match?.[1]) continue;
    const title = cleanText(match[1]);
    let gloss = match[2] ? cleanGloss(match[2]) : "";

    // Possessive suffix style lines without direct gloss capture
    if (!gloss && /آخر میں/.test(line)) {
      if (/هُ[^ا-ی]|هُ\s*لگ/u.test(line) || title === "هُ") {
        gloss = "اس کا / اس کی";
      } else if (/كَ[^ا-ی]|كَ\s*لگ/u.test(line) || title === "كَ") {
        gloss = "تیرا / تیری";
      } else if (/هَا|هَا\s*لگ/u.test(line) || title === "هَا") {
        gloss = "اس کا / اس کی (مؤنث)";
      } else if (/هُم|كُمْ/u.test(title)) {
        gloss = title.includes("كُمْ")
          ? "تم لوگوں کا / تم لوگوں کی"
          : "ان لوگوں کا / ان لوگوں کی";
      }
    }

    if (!title || title.length > 28) continue;
    if (!gloss || gloss.length > 80) continue;
    if (/ترجمہ|درج ذیل|مثال/u.test(gloss)) continue;
    return { title, gloss };
  }
  return null;
}

function buildDefinition(title: string, gloss: string, line: string): string {
  const parts = [`${title} کا مطلب «${gloss}» ہے۔`];
  if (/دو الفاظ|ملاتی/u.test(line)) parts.push("دو الفاظ کو جوڑتی ہے۔");
  if (/جملے کے شروع/u.test(line)) parts.push("جملے کے شروع میں آتا ہے۔");
  if (/نیچے عموماً زیر|زیر ہوتی/u.test(line)) {
    parts.push("اگلے لفظ پر عموماً زیر ہوتی ہے۔");
  }
  if (/پر زبر|زبر ہوتی/u.test(line)) {
    parts.push("اگلے مفرد پر زبر ہوتی ہے۔");
  }
  if (/قطعہ بناتے|ترجمہ اکٹھا/u.test(line)) {
    parts.push("اگلے لفظ کے ساتھ قطعہ بناتا ہے؛ ترجمہ اکٹھا ہوتا ہے۔");
  }
  if (/تنوین/.test(line) && /جملہ/.test(line)) {
    parts.push("بعد والے تنوین والے لفظ سے سادہ جملہ بنتا ہے۔");
  }
  if (/تاکید/.test(line)) parts.push("تاکید کے لیے آتا ہے۔");
  return parts.join(" ").slice(0, 200);
}

const CURATED_SEED: DistilledRule[] = [
  {
    id: "seed-1-1",
    unit: 1,
    order: 1,
    title: "الـ",
    definition:
      "الـ معرفہ کا نشان ہے۔ اسے ہٹا کر دیکھو تو بہت سے الفاظ اردو میں پہچان میں آ جاتے ہیں؛ مطلب ایک ہی رہتا ہے چاہے الـ ہو یا نہ ہو۔",
  },
  {
    id: "seed-1-2",
    unit: 1,
    order: 2,
    title: "آخری حرکات",
    definition:
      "لفظ کے آخر کی زیر، زبر یا پیش سے بنیادی معنی نہیں بدلتا؛ پہچان کے لیے لفظ کے تنے پر توجہ دو۔",
  },
  {
    id: "seed-1-3",
    unit: 1,
    order: 3,
    title: "وَ",
    definition: "وَ کا مطلب «اور» ہے۔ یہ دو الفاظ کو آپس میں جوڑتی ہے۔",
  },
  {
    id: "seed-1-4",
    unit: 1,
    order: 4,
    title: "هذَا",
    definition:
      "هذَا کا مطلب «یہ» ہے۔ اس کے بعد تنوین والے لفظ سے سادہ جملہ بنتا ہے۔",
  },
  {
    id: "seed-1-5",
    unit: 1,
    order: 5,
    title: "لَـ",
    definition:
      "لفظ کے شروع میں لَـ تاکید کا لام ہے؛ مفہوم میں «یقیناً / بے شک» کا اضافہ ہوتا ہے۔",
  },
];

async function main() {
  const files = (await readdir(ORIGINAL_DIR))
    .filter((name) => name.endsWith(".txt"))
    .sort((a, b) => (unitFromFilename(a) ?? 0) - (unitFromFilename(b) ?? 0));

  const byKey = new Map<string, DistilledRule>();

  for (const seed of CURATED_SEED) {
    byKey.set(`${seed.unit}:${seed.title}`, seed);
  }

  let autoOrder = 100;
  for (const file of files) {
    const unit = unitFromFilename(file);
    if (unit == null || unit < 1 || unit > 7) continue;
    const text = await readFile(path.join(ORIGINAL_DIR, file), "utf8");
    for (const raw of text.split(/\r?\n/)) {
      if (isNoiseLine(raw)) continue;
      if (!/مطلب|معنی|مفہوم|واضح/u.test(raw)) continue;
      const pair = extractPair(raw);
      if (!pair) continue;
      const key = `${unit}:${pair.title}`;
      if (byKey.has(key)) continue;
      autoOrder += 1;
      byKey.set(key, {
        id: `auto-${unit}-${autoOrder}`,
        unit,
        order: autoOrder,
        title: pair.title,
        definition: buildDefinition(pair.title, pair.gloss, raw),
      });
    }
  }

  const finalRules: DistilledRule[] = [];
  for (const unit of [1, 2, 3, 4, 5, 6, 7]) {
    const list = [...byKey.values()]
      .filter((rule) => rule.unit === unit)
      .sort((a, b) => a.order - b.order);
    list.forEach((rule, index) => {
      finalRules.push({
        ...rule,
        order: index + 1,
        id: `unit-${unit}-rule-${index + 1}`,
      });
    });
  }

  await mkdir(path.dirname(OUT_FILE), { recursive: true });
  // Also keep a copy under data/curriculum for the app (not gitignored exports/)
  const appCopy = path.join(
    process.cwd(),
    "data",
    "curriculum",
    "learner-rules.json",
  );
  await mkdir(path.dirname(appCopy), { recursive: true });
  const payload = JSON.stringify(
      {
        version: 1,
        builtAt: new Date().toISOString(),
        source: "knowledge/books/original/Unit 1–7.txt",
        note: "Brief Muallim-based definitions for revision — no page numbers, no exercises.",
        entryCount: finalRules.length,
        rules: finalRules,
      },
      null,
      2,
    );
  await writeFile(OUT_FILE, payload, "utf8");
  await writeFile(appCopy, payload, "utf8");

  console.log(
    JSON.stringify(
      {
        count: finalRules.length,
        byUnit: Object.fromEntries(
          [1, 2, 3, 4, 5, 6, 7].map((unit) => [
            unit,
            finalRules.filter((rule) => rule.unit === unit).length,
          ]),
        ),
        sample: finalRules.slice(0, 10),
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
