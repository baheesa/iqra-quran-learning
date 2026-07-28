"use client";

import { useUiLocale } from "@/features/i18n/locale-context";

export function SkipLinkClient() {
  const { t } = useUiLocale();
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:bg-surface focus:text-foreground focus:absolute focus:start-4 focus:top-4 focus:z-50 focus:rounded-lg focus:px-3 focus:py-2"
    >
      {t("skipToContent")}
    </a>
  );
}
