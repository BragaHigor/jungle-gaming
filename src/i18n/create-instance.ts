import { createInstance } from "i18next";

import { defaultLocale, locales, resources, type Locale } from "@/i18n/config";

export function createI18n(locale: Locale) {
  const instance = createInstance();

  // Resources are bundled, so initialization can finish before rendering.
  void instance.init({
    resources,
    lng: locale,
    fallbackLng: defaultLocale,
    supportedLngs: locales,
    load: "currentOnly",
    initAsync: false,
    interpolation: { escapeValue: false },
  });

  return instance;
}
