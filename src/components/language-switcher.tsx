"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

import { isLocale, localeCookieName, locales } from "@/i18n/config";
import { Icon } from "@/components/ui/icon";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
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
    <label
      className={
        compact
          ? "language-switcher language-switcher-compact"
          : "language-switcher"
      }
    >
      <span className={compact ? "sr-only" : undefined}>
        {t("language.label")}
      </span>
      <span className="language-select">
        <select
          value={i18n.language}
          onChange={(event) => changeLocale(event.target.value)}
          disabled={isPending}
          className="min-h-11 w-full appearance-none rounded-md border border-input bg-background py-2 pr-10 pl-3 text-foreground disabled:opacity-60"
        >
          {locales.map((locale) => (
            <option key={locale} value={locale}>
              {compact
                ? locale === "pt-BR"
                  ? "PT"
                  : "EN"
                : t(`language.options.${locale}`)}
            </option>
          ))}
        </select>
        <Icon
          name="chevronDown"
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2"
        />
      </span>
    </label>
  );
}
