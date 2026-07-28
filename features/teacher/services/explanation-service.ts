import type { RetrievedKnowledge } from "@/features/teacher/services/knowledge-retriever";
import type { TeacherContext, TeacherIntent } from "@/features/teacher/types";

/**
 * Deterministic recognition-first explanations when LLM is unavailable.
 * Uses retrieved knowledge only — never invents Muallim content.
 */
export function createExplanationService() {
  return {
    explain(input: {
      intent: TeacherIntent;
      question: string;
      context: TeacherContext;
      knowledge: RetrievedKnowledge;
    }): string {
      const word =
        input.context.reading.selectedWord?.arabic ??
        input.knowledge.vocabulary[0]?.arabic ??
        null;
      const vocab = input.knowledge.vocabulary[0] ?? null;
      const rule = input.knowledge.rules[0] ?? null;
      const lesson =
        input.knowledge.lessons[0] ??
        (input.context.relatedLesson
          ? {
              title: input.context.relatedLesson.title,
              source: "curriculum_seed" as const,
            }
          : null);

      const knownHint =
        input.context.adaptation?.reinforceWords[0] ??
        input.context.learner.knownVocabulary[0]?.arabic;
      const weakHint = input.context.adaptation?.mentionWeakWords[0];
      const depth = input.context.adaptation?.explanationDepth ?? "guided";
      const lines: string[] = [];

      if (
        input.context.adaptation?.emphasizeRecognition !== false &&
        (input.intent === "WORD" || input.intent === "PHRASE" || word)
      ) {
        lines.push(
          word
            ? `کیا آپ نے لفظ **${word}** پہلے دیکھا ہے؟`
            : "کیا آپ نے یہ لفظ پہلے دیکھا ہے؟",
        );
        if (knownHint) {
          lines.push(
            `آپ پہلے **${knownHint}** پہچان چکے ہیں۔ اس سے جوڑ کر سوچیں۔`,
          );
        } else {
          lines.push("ایک لمحہ رک کر لفظ کو دوبارہ دیکھیں۔");
        }
        if (weakHint && weakHint !== word) {
          lines.push(`یاد رہے: **${weakHint}** بھی نظرثانی چاہتا ہے۔`);
        }
      } else {
        lines.push("پہلے پہچان کی کوشش کریں، پھر وضاحت۔");
      }

      if (vocab) {
        if (vocab.source === "muallim_approved") {
          lines.push("");
          lines.push("**معلم القرآن (تصدیق شدہ):**");
          lines.push(`${vocab.arabic} — ${vocab.urduMeaning}`);
        } else {
          lines.push("");
          lines.push("**سیڈ نصاب (عارضی رہنمائی):**");
          lines.push(`${vocab.arabic} — ${vocab.urduMeaning}`);
          if (depth !== "brief") {
            lines.push(
              "نوٹ: یہ معلم PDF کی مکمل تصدیق نہیں — Admin میں approve/publish کے بعد یہاں معلم کا مواد آئے گا۔",
            );
          }
          if (depth === "detailed") {
            lines.push("اسے سیاقِ آیت میں دوبارہ پڑھ کر پہچانیں۔");
          }
        }
      } else if (rule) {
        lines.push("");
        if (rule.source === "muallim_approved") {
          lines.push("**معلم القاعدة (تصدیق شدہ):**");
        } else {
          lines.push("**سیڈ قاعدہ (عارضی):**");
        }
        lines.push(`${rule.title}: ${rule.explanation}`);
        if (rule.examples[0] && depth !== "brief") {
          lines.push(`مثال: ${rule.examples[0]}`);
        }
      } else if (!input.knowledge.hasApprovedMuallim) {
        lines.push("");
        lines.push(
          "اس سوال کا جواب ابھی تصدیق شدہ معلم المواد میں نہیں ملا۔ ترجمہ پر انحصار کیے بغیر قراءت جاری رکھیں۔",
        );
      }

      if (lesson && depth !== "brief") {
        lines.push("");
        lines.push(`متعلقہ سبق: ${lesson.title}`);
      }

      if (input.context.adaptation?.guidanceUrdu && depth === "detailed") {
        lines.push("");
        lines.push(input.context.adaptation.guidanceUrdu);
      }

      lines.push("");
      lines.push("اب قرآن کی طرف واپس جائیں اور اگلی آیت پڑھیں۔");

      return lines.join("\n");
    },
  };
}

export type ExplanationService = ReturnType<typeof createExplanationService>;
