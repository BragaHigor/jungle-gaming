import ptBR from "@/i18n/locales/pt-BR.json";
import en from "@/i18n/locales/en.json";

export const locales = ["pt-BR", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "pt-BR";
export const localeCookieName = "canopy-locale";

export const resources = {
  "pt-BR": { translation: ptBR },
  en: { translation: en satisfies typeof ptBR },
};

export function isLocale(value: unknown): value is Locale {
  return value === "pt-BR" || value === "en";
}
