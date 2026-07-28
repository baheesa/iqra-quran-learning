"use client";

import { useUiLocale } from "@/features/i18n/locale-context";

export function UnitLabel({ unit }: { unit: number }) {
  const { t } = useUiLocale();
  return <>{t("unitWords.unit", { unit: String(unit) })}</>;
}

export function RuleExampleLabel() {
  const { t } = useUiLocale();
  return <span className="text-muted text-sm">{t("rules.example")} </span>;
}
