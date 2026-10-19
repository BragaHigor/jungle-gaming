"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  catalogScenarios,
  createCatalogView,
  isCatalogScenario,
  isPreviewSize,
  previewSizes,
  previewWidths,
  type CatalogScenario,
  type PreviewSize,
} from "../scenarios";
import { ReadOnlyGame } from "./read-only-game";

export function StateGallery() {
  const { t } = useTranslation();
  const [scenario, setScenario] = useState<CatalogScenario>("ready");
  const [size, setSize] = useState<PreviewSize>("fluid");
  const [animate, setAnimate] = useState(false);
  return (
    <div className="catalog-gallery">
      <div className="catalog-controls">
        <label>
          <span>{t("catalog.gallery.scenario")}</span>
          <select
            value={scenario}
            onChange={(event) => {
              if (isCatalogScenario(event.target.value))
                setScenario(event.target.value);
            }}
          >
            {catalogScenarios.map((item) => (
              <option key={item} value={item}>
                {t(`catalog.scenarios.${item}`)}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>{t("catalog.gallery.width")}</span>
          <select
            value={size}
            onChange={(event) => {
              if (isPreviewSize(event.target.value))
                setSize(event.target.value);
            }}
          >
            {previewSizes.map((item) => (
              <option key={item} value={item}>
                {t(`catalog.gallery.sizes.${item}`)}
              </option>
            ))}
          </select>
        </label>
        <label className="catalog-motion">
          <input
            type="checkbox"
            checked={animate}
            onChange={(event) => setAnimate(event.target.checked)}
          />
          {t("catalog.gallery.animate")}
        </label>
      </div>
      <p className="catalog-help">{t("catalog.gallery.widthNote")}</p>
      <figure
        className="catalog-preview-frame"
        style={{ maxWidth: previewWidths[size] }}
      >
        <figcaption>
          {t("catalog.gallery.caption", {
            scenario: t(`catalog.scenarios.${scenario}`),
          })}
        </figcaption>
        <ReadOnlyGame
          view={createCatalogView(scenario)}
          reducedMotion={!animate}
        />
      </figure>
    </div>
  );
}
