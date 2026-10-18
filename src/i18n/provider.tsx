"use client";

import { useMemo, type ReactNode } from "react";
import { I18nextProvider } from "react-i18next";

import type { Locale } from "@/i18n/config";
import { createI18n } from "@/i18n/create-instance";

export function TranslationProvider({
  locale,
  children,
}: Readonly<{ locale: Locale; children: ReactNode }>) {
  const instance = useMemo(() => createI18n(locale), [locale]);

  return <I18nextProvider i18n={instance}>{children}</I18nextProvider>;
}
