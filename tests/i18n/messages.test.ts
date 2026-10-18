import { describe, expect, it } from "vitest";

import ptBR from "@/i18n/locales/pt-BR.json";
import en from "@/i18n/locales/en.json";

function flatten(
  messages: Record<string, unknown>,
  prefix = "",
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(messages)) {
    const path = prefix ? `${prefix}.${key}` : key;

    if (typeof value === "string") {
      result[path] = value;
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(result, flatten(value as Record<string, unknown>, path));
    } else {
      throw new Error(`Invalid translation value: ${path}`);
    }
  }

  return result;
}

function placeholders(message: string) {
  return [...message.matchAll(/{{\s*([^{}]+?)\s*}}/g)]
    .map((match) => match[1])
    .sort();
}

describe("arquivos de tradução", () => {
  const portuguese = flatten(ptBR);
  const english = flatten(en);

  it("possui as mesmas chaves nos dois idiomas", () => {
    expect(Object.keys(english).sort()).toEqual(Object.keys(portuguese).sort());
  });

  it("não contém mensagens vazias", () => {
    for (const messages of [portuguese, english]) {
      for (const [key, value] of Object.entries(messages)) {
        expect(value.trim(), `Empty translation: ${key}`).not.toBe("");
      }
    }
  });

  it("preserva os marcadores de interpolação entre os idiomas", () => {
    for (const [key, message] of Object.entries(portuguese)) {
      expect(english[key], `Missing English translation: ${key}`).toBeDefined();
      expect(placeholders(english[key])).toEqual(placeholders(message));
    }
  });
});
