"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

import { isLocale, localeCookieName, locales } from "@/i18n/config";

export function LanguageSwitcher() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const [isPending, startTransition] = useTransition();

  function changeLocale(value: string) {
    if (!isLocale(value) || value === i18n.language) return;

    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${localeCookieName}=${value}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
    startTransition(() => router.refresh());
  }

  return (
    <label className="flex items-center gap-3 text-sm text-stone-300">
      <span>{t("language.label")}</span>
      <select
        value={i18n.language}
        onChange={(event) => changeLocale(event.target.value)}
        disabled={isPending}
        className="min-h-11 rounded border border-stone-700 bg-stone-950 px-3 text-stone-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-stone-100 disabled:opacity-60"
      >
        {locales.map((locale) => (
          <option key={locale} value={locale}>
            {t(`language.options.${locale}`)}
          </option>
        ))}
      </select>
    </label>
  );
}
