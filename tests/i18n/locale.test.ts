import { beforeEach, describe, expect, it, vi } from "vitest";

import { createI18n } from "@/i18n/create-instance";
import { getLocale, getTranslations } from "@/i18n/server";

const { readCookie } = vi.hoisted(() => ({ readCookie: vi.fn() }));

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: readCookie }),
}));

beforeEach(() => {
  readCookie.mockReset();
});

describe("idioma selecionado pela requisição", () => {
  it("usa português brasileiro quando não há preferência", async () => {
    expect(await getLocale()).toBe("pt-BR");
  });

  it.each(["pt-BR", "en"])("aceita o idioma permitido %s", async (locale) => {
    readCookie.mockReturnValue({ value: locale });
    expect(await getLocale()).toBe(locale);
  });

  it.each(["fr", "en-US", "", "<script>"])(
    "usa o idioma padrão para a preferência não permitida %j",
    async (locale) => {
      readCookie.mockReturnValue({ value: locale });
      expect(await getLocale()).toBe("pt-BR");
    },
  );

  it("retorna as traduções do servidor no idioma selecionado", async () => {
    readCookie.mockReturnValue({ value: "en" });
    const t = await getTranslations();
    expect(t("language.label")).toBe("Language");
  });

  it("mantém a alteração de idioma de um usuário isolada da outra instância", async () => {
    const first = createI18n("pt-BR");
    const second = createI18n("pt-BR");
    await second.changeLanguage("en");

    expect(first.t("language.label")).toBe("Idioma");
    expect(second.t("language.label")).toBe("Language");
  });
});
