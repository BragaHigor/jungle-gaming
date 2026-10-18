import type { Metadata } from "next";
import type { ReactNode } from "react";
import { cookies } from "next/headers";
import localFont from "next/font/local";

import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { TranslationProvider } from "@/i18n/provider";
import { getLocale, getTranslations } from "@/i18n/server";
import { QueryProvider } from "@/lib/query-provider";
import { getTheme, themeCookieName } from "@/lib/theme";
import "@/app/globals.css";

const jost = localFont({
  src: "../assets/fonts/Jost.ttf",
  variable: "--font-jost",
  weight: "100 900",
  display: "swap",
});
const bowlby = localFont({
  src: "../assets/fonts/BowlbyOne.ttf",
  variable: "--font-bowlby",
  weight: "400",
  display: "swap",
  preload: false,
});
const yellowtail = localFont({
  src: "../assets/fonts/Yellowtail.ttf",
  variable: "--font-yellowtail",
  weight: "400",
  display: "swap",
  preload: false,
});

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
  const theme = getTheme((await cookies()).get(themeCookieName)?.value);
  const t = await getTranslations();

  return (
    <html
      lang={locale}
      data-theme={theme}
      className={`${jost.variable} ${bowlby.variable} ${yellowtail.variable}`}
    >
      <body>
        <QueryProvider>
          <TranslationProvider locale={locale}>
            <div className="site-shell">
              <a href="#main-content" className="skip-link">
                {t("navigation.skip")}
              </a>
              <SiteHeader theme={theme} />
              {children}
              <SiteFooter />
            </div>
          </TranslationProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
