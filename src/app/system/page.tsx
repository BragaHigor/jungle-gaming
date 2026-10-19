import type { Metadata } from "next";
import { Icon } from "@/components/ui/icon";
import { typographySamples, visualTokens } from "@/content/catalog";
import { CatalogHeading } from "@/features/catalog/components/catalog-heading";
import { ReadOnlyGame } from "@/features/catalog/components/read-only-game";
import { SystemControls } from "@/features/catalog/components/system-controls";
import { createCatalogView } from "@/features/catalog/scenarios";
import { symbols } from "@/features/game/presentation";
import { getTranslations } from "@/i18n/server";
import "@/features/game/game.css";
import "@/features/catalog/catalog.css";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: t("catalog.system.metadataTitle"),
    description: t("catalog.system.intro"),
  };
}
export default async function SystemPage() {
  const t = await getTranslations();
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="site-container catalog-page"
    >
      <CatalogHeading page="system" />
      <section className="catalog-section" aria-labelledby="palette-title">
        <h2 id="palette-title">{t("catalog.system.palette")}</h2>
        <p className="catalog-section-copy">
          {t("catalog.system.paletteNote")}
        </p>
        <ul className="catalog-palette">
          {visualTokens.map((token) => (
            <li key={token.id}>
              <span
                className="catalog-swatch"
                style={{ background: `var(${token.variable})` }}
                aria-hidden="true"
              />
              <h3>{t(`catalog.system.tokens.${token.id}`)}</h3>
              <code>{token.variable}</code>
            </li>
          ))}
        </ul>
        <div className="catalog-gradient" aria-hidden="true" />
        <p className="catalog-help">{t("catalog.system.gradient")}</p>
      </section>
      <section className="catalog-section" aria-labelledby="typography-title">
        <h2 id="typography-title">{t("catalog.system.typography")}</h2>
        <div className="catalog-type-grid">
          {typographySamples.map((font) => (
            <figure key={font.id}>
              <figcaption>{font.name}</figcaption>
              <p className={`catalog-type-${font.id}`}>
                {t(`catalog.system.samples.${font.id}`)}
              </p>
              <p className="catalog-help">
                {t(`catalog.system.fontRoles.${font.id}`)}
              </p>
            </figure>
          ))}
        </div>
      </section>
      <section className="catalog-section" aria-labelledby="controls-title">
        <h2 id="controls-title">{t("catalog.system.controls")}</h2>
        <p className="catalog-section-copy">
          {t("catalog.system.controlsNote")}
        </p>
        <SystemControls />
      </section>
      <section className="catalog-section" aria-labelledby="symbols-title">
        <h2 id="symbols-title">{t("catalog.system.symbols")}</h2>
        <ul className="catalog-symbols">
          {symbols.map((symbol) => (
            <li key={symbol}>
              <Icon name={symbol} className={`symbol-${symbol}`} />
              <span>{t(`game.symbols.${symbol}`)}</span>
            </li>
          ))}
        </ul>
      </section>
      <section className="catalog-section" aria-labelledby="composition-title">
        <h2 id="composition-title">{t("catalog.system.composition")}</h2>
        <p className="catalog-section-copy">
          {t("catalog.system.compositionNote")}
        </p>
        <div className="catalog-preview-frame">
          <ReadOnlyGame view={createCatalogView("win")} />
        </div>
      </section>
    </main>
  );
}
