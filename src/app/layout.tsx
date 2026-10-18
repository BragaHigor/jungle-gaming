import type { Metadata } from "next";
import type { ReactNode } from "react";

import { LanguageSwitcher } from "@/components/language-switcher";
import { TranslationProvider } from "@/i18n/provider";
import { getLocale, getTranslations } from "@/i18n/server";
import "@/app/globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();

  return {
    title: t("metadata.title"),
    description: t("metadata.description"),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const locale = await getLocale();

  return (
    <html lang={locale}>
      <body>
        <TranslationProvider locale={locale}>
          <header className="mx-auto flex w-full max-w-3xl justify-end px-6 pt-6 sm:px-10">
            <LanguageSwitcher />
          </header>
          {children}
        </TranslationProvider>
      </body>
    </html>
  );
}
