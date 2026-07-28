"use client";

import { useEffect, useMemo, useState } from "react";

import { AppShell } from "@/features/i18n/AppShell";
import { useUiLocale } from "@/features/i18n/locale-context";
import { UNKNOWN_WORD_MESSAGE } from "@/features/knowledge/domain/vocabulary-lookup";
import {
  createTappedWordsService,
  type TappedWordRecord,
} from "@/features/reading/services/tapped-words-service";
import { createBrowserLocalStorage } from "@/lib/storage/adapter";

export default function VocabularyPage() {
  const { t } = useUiLocale();
  const storage = useMemo(() => createBrowserLocalStorage(), []);
  const service = useMemo(() => createTappedWordsService(storage), [storage]);
  const [words, setWords] = useState<TappedWordRecord[]>([]);

  useEffect(() => {
    setWords(service.list());
  }, [service]);

  function refresh() {
    setWords(service.list());
  }

  return (
    <AppShell>
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 md:px-6">
        <header>
          <p className="text-muted text-sm">{t("myWords.eyebrow")}</p>
          <h1 className="text-primary text-3xl tracking-tight">
            {t("myWords.title")}
          </h1>
          <p className="text-muted mt-2 max-w-xl text-sm leading-relaxed">
            {t("myWords.blurb")}
          </p>
        </header>

        <div className="flex items-center justify-between gap-3">
          <p className="text-muted text-sm">
            {t("myWords.count", { count: words.length })}
          </p>
          {words.length > 0 ? (
            <button
              type="button"
              className="text-muted text-sm"
              onClick={() => {
                service.clear();
                refresh();
              }}
            >
              {t("myWords.clear")}
            </button>
          ) : null}
        </div>

        {words.length === 0 ? (
          <p className="text-muted rounded-2xl border border-dashed px-4 py-10 text-center text-sm">
            {t("myWords.empty")}
          </p>
        ) : (
          <ul className="space-y-3">
            {words.map((word) => (
              <li
                key={word.id}
                className="border-border bg-surface/80 flex items-start justify-between gap-3 rounded-2xl border px-4 py-3"
              >
                <div>
                  <p
                    className="font-quran text-primary text-3xl leading-relaxed"
                    dir="rtl"
                    lang="ar"
                  >
                    {word.arabic}
                  </p>
                  <p
                    className="font-urdu text-foreground mt-1 text-lg leading-relaxed"
                    dir="rtl"
                    lang="ur"
                  >
                    {word.meaning ?? UNKNOWN_WORD_MESSAGE}
                  </p>
                  <p className="text-muted mt-1 text-xs">
                    {t("myWords.taps", { count: word.tapCount })}
                    {" · "}
                    {word.lastPage != null
                      ? t("myWords.page", { page: word.lastPage })
                      : "—"}
                  </p>
                </div>
                <button
                  type="button"
                  className="text-muted shrink-0 text-sm"
                  onClick={() => {
                    service.remove(word.id);
                    refresh();
                  }}
                >
                  {t("myWords.delete")}
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
    </AppShell>
  );
}
