"use client";

import { useState, useTransition } from "react";

import { AI_EXPLANATION_LABEL } from "@/features/knowledge/domain/verified-knowledge-view";
import type { TeacherResponse } from "@/features/teacher/types";
import type { SelectedWordInfo } from "@/types/quran";

type Props = {
  selectedWord: SelectedWordInfo | null;
  page: number | null;
  juz: number | null;
};

/**
 * Optional teacher Q&A — verified Muallim knowledge stays in WordInfoPanel.
 * AI is only for extra questions the learner types.
 */
export function TeacherPanel({ selectedWord, page, juz }: Props) {
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState<TeacherResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function ask() {
    if (!question.trim()) return;
    setError(null);
    startTransition(async () => {
      try {
        const payload = {
          question: question.trim(),
          conversationId: response?.conversationId,
          reading: {
            page,
            juz,
            surahId: selectedWord?.surahId ?? null,
            ayahNumber: selectedWord?.ayahNumber ?? null,
            selectedWord: selectedWord
              ? {
                  id: selectedWord.id,
                  arabic: selectedWord.arabic,
                  position: selectedWord.position,
                }
              : null,
            selectedPhrase: null,
          },
        };

        const res = await fetch("/api/v1/teacher/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          throw new Error("استاد سے رابطہ نہیں ہو سکا");
        }
        const data = (await res.json()) as { response: TeacherResponse };
        setResponse(data.response);
        setQuestion("");
      } catch {
        setError("کچھ غلط ہو گیا۔ دوبارہ کوشش کریں۔");
      }
    });
  }

  return (
    <section className="border-border bg-surface/70 space-y-4 rounded-2xl border p-4">
      <div>
        <p className="text-muted text-sm">اضافی سوال (اختیاری)</p>
        <h2 className="text-primary text-xl">استاد</h2>
      </div>

      {selectedWord ? (
        <p className="font-quran text-2xl leading-relaxed">
          {selectedWord.arabic}
        </p>
      ) : (
        <p className="text-muted text-sm">کوئی سوال لکھیں اگر مزید مدد چاہیے۔</p>
      )}

      <label className="block space-y-1">
        <span className="text-muted text-xs">سوال</span>
        <textarea
          className="border-border bg-surface w-full rounded-2xl border p-3 text-sm"
          rows={2}
          placeholder="مختصر سوال…"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          aria-label="استاد سے سوال"
        />
      </label>

      <button
        type="button"
        disabled={pending || !question.trim()}
        className="border-border rounded-xl border px-4 py-2 text-sm disabled:opacity-50"
        onClick={() => ask()}
      >
        سوال پوچھیں
      </button>

      {error ? (
        <p className="text-warning text-sm" role="alert">
          {error}
        </p>
      ) : null}

      {response ? (
        <div className="border-border space-y-3 border-t pt-4 text-sm">
          <p className="text-muted text-xs">{AI_EXPLANATION_LABEL}</p>
          <div className="leading-relaxed whitespace-pre-wrap">
            {response.answer}
          </div>
          {response.suggestions.length > 0 ? (
            <ul className="text-muted list-inside list-disc">
              {response.suggestions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
