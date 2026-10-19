import { createElement, Fragment } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { I18nextProvider } from "react-i18next";
import { describe, expect, it } from "vitest";
import { createI18n } from "@/i18n/create-instance";
import { StateGallery } from "@/features/catalog/components/state-gallery";
import { ReadOnlyGame } from "@/features/catalog/components/read-only-game";
import { SystemControls } from "@/features/catalog/components/system-controls";
import {
  catalogScenarios,
  createCatalogView,
} from "@/features/catalog/scenarios";
import type { Locale } from "@/i18n/config";

function render(
  child: ReturnType<typeof createElement>,
  locale: Locale = "pt-BR",
) {
  return renderToStaticMarkup(
    createElement(I18nextProvider, { i18n: createI18n(locale) }, child),
  );
}

describe("catálogo isolado da sessão real", () => {
  it.each(["pt-BR", "en"] as const)(
    "renderiza a galeria em %s sem janela, Query ou provider do jogo",
    (locale) => {
      const html = render(createElement(StateGallery), locale);
      expect(html).toContain("<select");
      expect(html).not.toContain("<button");
      expect(html).not.toContain('class="game-reel-strip"');
      expect(html).toContain("<h2>");
      expect(html).not.toContain("<h3>");
    },
  );

  it("apresenta todos os estados sem comandos que enviem ou recuperem rodadas", () => {
    for (const scenario of catalogScenarios) {
      const view = createCatalogView(scenario);
      const html = render(createElement(ReadOnlyGame, { view }));
      expect(html).toContain(`data-phase="${scenario}"`);
      expect(html).not.toContain("<button");
      expect(html).toContain('data-reduced-motion="true"');
      expect(html).not.toContain('class="game-reel-strip"');
    }
  });

  it("mantém desconhecidos os dados de sessão ausente e preserva os dados anteriores na parada", () => {
    const unavailable = createCatalogView("unavailable");
    expect(unavailable.balance).toBeNull();
    expect(unavailable.history).toEqual([]);
    const ready = createCatalogView("ready");
    const stopping = createCatalogView("stopping");
    expect(stopping.balance).toBe(ready.balance);
    expect(stopping.history).toEqual(ready.history);
    expect(stopping.prize).toBe(ready.prize);
    expect(stopping.reels.map((reel) => reel[1])).toEqual([
      "flower",
      "flower",
      "flower",
    ]);
  });

  it("separa os grupos de seleção do sistema e da prévia somente leitura", () => {
    const html = render(
      createElement(
        Fragment,
        null,
        createElement(SystemControls),
        createElement(ReadOnlyGame, { view: createCatalogView("win") }),
      ),
    );
    const names = [...html.matchAll(/name="([^"]+)"/g)].map(
      (match) => match[1],
    );
    expect(names).toHaveLength(6);
    expect(new Set(names)).toHaveLength(2);
  });

  it.each(["pt-BR", "en"] as const)(
    "mantém títulos e referências únicos ao compor duas prévias em %s",
    (locale) => {
      const html = render(
        createElement(
          Fragment,
          null,
          createElement(ReadOnlyGame, { view: createCatalogView("win") }),
          createElement(ReadOnlyGame, { view: createCatalogView("loss") }),
        ),
        locale,
      );
      const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(
        (match) => match[1],
      );
      const references = [...html.matchAll(/aria-labelledby="([^"]+)"/g)].map(
        (match) => match[1],
      );
      expect(new Set(ids).size).toBe(ids.length);
      expect(references).toHaveLength(2);
      expect(new Set(references).size).toBe(2);
      for (const id of references) expect(html).toContain(`<h2 id="${id}">`);
    },
  );
});
