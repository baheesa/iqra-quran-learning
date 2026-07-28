"use client";

import { useUiLocale } from "@/features/i18n/locale-context";

export function CurriculumPageHeader({ empty }: { empty: boolean }) {
  const { t } = useUiLocale();
  return (
    <>
      <header>
        <p className="text-muted text-sm">{t("unitWords.eyebrow")}</p>
        <h1 className="text-primary text-3xl tracking-tight">{t("unitWords.title")}</h1>
        <p className="text-muted mt-2 max-w-xl text-sm leading-relaxed">
          {t("unitWords.blurb")}
        </p>
      </header>
      {empty ? (
        <p className="text-muted rounded-2xl border border-dashed px-4 py-8 text-center text-sm">
          {t("unitWords.empty")}
        </p>
      ) : null}
    </>
  );
}

export function AyahsPageHeader({ empty }: { empty: boolean }) {
  const { t } = useUiLocale();
  return (
    <>
      <header>
        <p className="text-muted text-sm">{t("unitAyahs.eyebrow")}</p>
        <h1 className="text-primary text-3xl tracking-tight">{t("unitAyahs.title")}</h1>
        <p className="text-muted mt-2 max-w-xl text-sm leading-relaxed">
          {t("unitAyahs.blurb")}
        </p>
      </header>
      {empty ? (
        <p className="text-muted rounded-2xl border border-dashed px-4 py-8 text-center text-sm">
          {t("unitAyahs.empty")}
        </p>
      ) : null}
    </>
  );
}

export function RulesPageHeader({ empty }: { empty: boolean }) {
  const { t } = useUiLocale();
  return (
    <>
      <header>
        <p className="text-muted text-sm">{t("rules.eyebrow")}</p>
        <h1 className="text-primary text-3xl tracking-tight">{t("rules.title")}</h1>
        <p className="text-muted mt-2 max-w-xl text-sm leading-relaxed">
          {t("rules.blurb")}
        </p>
      </header>
      {empty ? (
        <p className="text-muted rounded-2xl border border-dashed px-4 py-8 text-center text-sm">
          {t("rules.empty")}
        </p>
      ) : null}
    </>
  );
}
