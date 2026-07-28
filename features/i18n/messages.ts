export type UiLocale = "ur" | "en";

/** @deprecated Locale toggle removed; UI chrome is English-only. */
export const UI_LOCALE_STORAGE_KEY = "quran.ui.locale";
export const DEFAULT_UI_LOCALE: UiLocale = "en";

export type UiMessageKey =
  | "skipToContent"
  | "appTagline"
  | "appBlurb"
  | "nav.quran"
  | "nav.continueReading"
  | "nav.myWords"
  | "nav.unitWords"
  | "nav.unitAyahs"
  | "nav.rules"
  | "nav.duas"
  | "nav.session"
  | "nav.review"
  | "nav.dashboard"
  | "nav.signIn"
  | "nav.home"
  | "dailyTarget"
  | "interfaceLanguage"
  | "locale.urdu"
  | "locale.english"
  | "reading.title"
  | "reading.subtitle"
  | "myWords.eyebrow"
  | "myWords.title"
  | "myWords.blurb"
  | "myWords.count"
  | "myWords.clear"
  | "myWords.empty"
  | "myWords.delete"
  | "myWords.taps"
  | "myWords.page"
  | "unitWords.eyebrow"
  | "unitWords.title"
  | "unitWords.blurb"
  | "unitWords.empty"
  | "unitWords.unit"
  | "unitWords.word"
  | "unitWords.phrase"
  | "unitAyahs.eyebrow"
  | "unitAyahs.title"
  | "unitAyahs.blurb"
  | "unitAyahs.empty"
  | "rules.eyebrow"
  | "rules.title"
  | "rules.blurb"
  | "rules.empty"
  | "rules.example"
  | "rules.examples"
  | "rules.moreExamples"
  | "rules.showLess"
  | "rules.expandExamples"
  | "rules.collapseExamples"
  | "filter.unit"
  | "filter.progress"
  | "filter.kind"
  | "filter.all"
  | "filter.learned"
  | "filter.remaining"
  | "filter.words"
  | "filter.phrases"
  | "filter.showing"
  | "filter.nextRemaining"
  | "filter.search"
  | "filter.none"
  | "mark.learned"
  | "mark.learnedYes"
  | "stats.total"
  | "stats.withMeaning"
  | "stats.learned"
  | "stats.remaining"
  | "lessonNote";

const ur: Record<UiMessageKey, string> = {
  skipToContent: "مین مواد پر جائیں",
  appTagline: "قرآن سیکھنے کا نظام",
  appBlurb:
    "قرآن کو براہِ راست سمجھنے کا سفر — ترجمہ پر انحصار کم کرتے ہوئے، معلم القرآن کے طریقے پر۔",
  "nav.quran": "قرآن",
  "nav.continueReading": "قرآن پڑھنا جاری رکھیں",
  "nav.myWords": "میرے الفاظ",
  "nav.unitWords": "یونٹ کے الفاظ",
  "nav.unitAyahs": "یونٹ کی آیات",
  "nav.rules": "قواعد",
  "nav.duas": "دعائیں",
  "nav.session": "آج کی نشست",
  "nav.review": "نظرثانی",
  "nav.dashboard": "ڈیش بورڈ",
  "nav.signIn": "سائن ان / ہم آہنگی",
  "nav.home": "صفحہ اول",
  dailyTarget: "روزانہ مطالعہ کا ہدف: تقریباً {minutes} منٹ",
  interfaceLanguage: "انٹرفیس کی زبان",
  "locale.urdu": "اردو",
  "locale.english": "English",
  "reading.title": "مطالعہ",
  "reading.subtitle": "قرآن مجید",
  "myWords.eyebrow": "ذاتی ذخیرہ",
  "myWords.title": "میرے الفاظ",
  "myWords.blurb": "قرآن پڑھتے وقت جن الفاظ پر آپ نے کلک کیا — یہاں دہرائیں۔",
  "myWords.count": "{count} الفاظ",
  "myWords.clear": "سب صاف کریں",
  "myWords.empty": "ابھی کوئی لفظ محفوظ نہیں۔ قرآن پڑھتے ہوئے کسی لفظ پر کلک کریں۔",
  "myWords.delete": "حذف",
  "myWords.taps": "{count} بار",
  "myWords.page": "صفحہ {page}",
  "unitWords.eyebrow": "معلم القرآن",
  "unitWords.title": "یونٹ کے الفاظ",
  "unitWords.blurb": "یونٹ، نمبر، اور سیکھے/باقی فلٹر سے الفاظ اور عبارات دیکھیں۔",
  "unitWords.empty": "فہرست ابھی تیار نہیں۔",
  "unitWords.unit": "یونٹ {unit}",
  "unitWords.word": "لفظ",
  "unitWords.phrase": "عبارت",
  "unitAyahs.eyebrow": "معلم القرآن",
  "unitAyahs.title": "یونٹ کی آیات",
  "unitAyahs.blurb": "یونٹ اور سیکھے/باقی فلٹر سے آیات دیکھیں؛ «اگلا باقی» سے آگے بڑھیں۔",
  "unitAyahs.empty": "فہرست ابھی تیار نہیں۔",
  "rules.eyebrow": "معلم القرآن",
  "rules.title": "قواعد",
  "rules.blurb": "یونٹ ۱ سے یونٹ ۷ — مختصر تعریف اور متعدد قرآنی مثالیں۔",
  "rules.empty": "قواعد ابھی تیار نہیں۔",
  "rules.example": "مثال:",
  "rules.examples": "مثالیں",
  "rules.moreExamples": "مزید {count} مثالیں",
  "rules.showLess": "کم دکھائیں",
  "rules.expandExamples": "سب مثالیں کھولیں",
  "rules.collapseExamples": "مثالیں بند کریں",
  "filter.unit": "یونٹ",
  "filter.progress": "پیشرفت",
  "filter.kind": "قسم",
  "filter.all": "تمام",
  "filter.learned": "سیکھے ہوئے",
  "filter.remaining": "باقی",
  "filter.words": "الفاظ",
  "filter.phrases": "عبارات",
  "filter.showing": "دکھائے جا رہے: {count}",
  "filter.nextRemaining": "اگلا باقی",
  "filter.search": "عربی یا معنی تلاش…",
  "filter.none": "اس فلٹر میں کچھ نہیں ملا۔",
  "mark.learned": "سیکھ لیا؟",
  "mark.learnedYes": "سیکھ لیا ✓",
  "stats.total": "کل {count}",
  "stats.withMeaning": "معنی والے {count}",
  "stats.learned": "سیکھے {count}",
  "stats.remaining": "باقی {count}",
  lessonNote: "سبق کا مواد اردو میں رہتا ہے۔",
};

const en: Record<UiMessageKey, string> = {
  skipToContent: "Skip to main content",
  appTagline: "Quran Learning System",
  appBlurb:
    "A path to understand the Quran more directly — less reliance on translation, following Muallim-ul-Quran.",
  "nav.quran": "Read Quran",
  "nav.continueReading": "Continue reading",
  "nav.myWords": "My words",
  "nav.unitWords": "Unit words",
  "nav.unitAyahs": "Unit ayahs",
  "nav.rules": "Qawaid",
  "nav.duas": "Duas",
  "nav.session": "Today’s session",
  "nav.review": "Review",
  "nav.dashboard": "Dashboard",
  "nav.signIn": "Sign in / sync",
  "nav.home": "Home",
  dailyTarget: "Daily study target: about {minutes} minutes",
  interfaceLanguage: "Interface language",
  "locale.urdu": "Urdu",
  "locale.english": "English",
  "reading.title": "Reading",
  "reading.subtitle": "The Noble Quran",
  "myWords.eyebrow": "Personal list",
  "myWords.title": "My words",
  "myWords.blurb": "Words you tapped while reading — review them here.",
  "myWords.count": "{count} words",
  "myWords.clear": "Clear all",
  "myWords.empty": "No words saved yet. Tap a word while reading the Quran.",
  "myWords.delete": "Remove",
  "myWords.taps": "{count}×",
  "myWords.page": "Page {page}",
  "unitWords.eyebrow": "Muallim-ul-Quran",
  "unitWords.title": "Unit words",
  "unitWords.blurb": "Browse words and phrases by unit, number, and learned progress.",
  "unitWords.empty": "List not ready yet.",
  "unitWords.unit": "Unit {unit}",
  "unitWords.word": "word",
  "unitWords.phrase": "phrase",
  "unitAyahs.eyebrow": "Muallim-ul-Quran",
  "unitAyahs.title": "Unit ayahs",
  "unitAyahs.blurb": "Browse ayahs by unit and progress; use Next remaining to continue.",
  "unitAyahs.empty": "List not ready yet.",
  "rules.eyebrow": "Muallim-ul-Quran",
  "rules.title": "Qawaid · Rules",
  "rules.blurb": "Units 1–7 — core lesson patterns with definitions and multiple Quran examples.",
  "rules.empty": "Rules are not ready yet.",
  "rules.example": "Example:",
  "rules.examples": "Examples",
  "rules.moreExamples": "{count} more examples",
  "rules.showLess": "Show less",
  "rules.expandExamples": "Expand all examples",
  "rules.collapseExamples": "Collapse examples",
  "filter.unit": "Unit",
  "filter.progress": "Progress",
  "filter.kind": "Type",
  "filter.all": "All",
  "filter.learned": "Learned",
  "filter.remaining": "Remaining",
  "filter.words": "Words",
  "filter.phrases": "Phrases",
  "filter.showing": "Showing: {count}",
  "filter.nextRemaining": "Next remaining",
  "filter.search": "Search Arabic or meaning…",
  "filter.none": "Nothing matches this filter.",
  "mark.learned": "Mark learned?",
  "mark.learnedYes": "Learned ✓",
  "stats.total": "Total {count}",
  "stats.withMeaning": "With meaning {count}",
  "stats.learned": "Learned {count}",
  "stats.remaining": "Remaining {count}",
  lessonNote: "Lesson content stays in Urdu.",
};

export const UI_MESSAGES: Record<UiLocale, Record<UiMessageKey, string>> = {
  ur,
  en,
};

export function formatUiMessage(
  _locale: UiLocale,
  key: UiMessageKey,
  vars?: Record<string, string | number>,
): string {
  let text = UI_MESSAGES.en[key] ?? key;
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.replaceAll(`{${name}}`, String(value));
    }
  }
  return text;
}
