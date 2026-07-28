"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

import {
  DEFAULT_UI_LOCALE,
  formatUiMessage,
  type UiLocale,
  type UiMessageKey,
} from "@/features/i18n/messages";

type UiLocaleContextValue = {
  locale: UiLocale;
  t: (key: UiMessageKey, vars?: Record<string, string | number>) => string;
  dir: "ltr";
};

const UiLocaleContext = createContext<UiLocaleContextValue | null>(null);

/** Learner UI chrome is English-only. Lesson content stays Arabic/Urdu. */
export function UiLocaleProvider({ children }: { children: ReactNode }) {
  const t = useCallback(
    (key: UiMessageKey, vars?: Record<string, string | number>) =>
      formatUiMessage(DEFAULT_UI_LOCALE, key, vars),
    [],
  );

  const value = useMemo(
    () =>
      ({
        locale: DEFAULT_UI_LOCALE,
        t,
        dir: "ltr" as const,
      }) satisfies UiLocaleContextValue,
    [t],
  );

  return (
    <UiLocaleContext.Provider value={value}>{children}</UiLocaleContext.Provider>
  );
}

export function useUiLocale(): UiLocaleContextValue {
  const ctx = useContext(UiLocaleContext);
  if (!ctx) {
    throw new Error("useUiLocale must be used within UiLocaleProvider");
  }
  return ctx;
}
