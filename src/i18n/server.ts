import { cookies } from "next/headers";

import { defaultLocale, isLocale, localeCookieName } from "@/i18n/config";
import { createI18n } from "@/i18n/create-instance";

export async function getLocale() {
  const value = (await cookies()).get(localeCookieName)?.value;
  return isLocale(value) ? value : defaultLocale;
}

export async function getTranslations() {
  const locale = await getLocale();
  return createI18n(locale).getFixedT(locale);
}
