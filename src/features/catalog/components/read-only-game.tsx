"use client";

import { useTranslation } from "react-i18next";
import { GameReels } from "@/features/game/components/reels";
import { GameMessage } from "@/features/game/components/game-message";
import { GameHistory } from "@/features/game/components/history";
import { Paytable } from "@/features/game/components/paytable";
import { BetSelector } from "@/features/game/components/bet-selector";
import type { GameView } from "@/features/game/presentation";

// No game provider, session hook, transport or storage is mounted by this preview.
export function ReadOnlyGame({
  view,
  reducedMotion = true,
}: {
  view: GameView;
  reducedMotion?: boolean;
}) {
  const { t, i18n } = useTranslation();
  return (
    <div className="catalog-game" data-reduced-motion={reducedMotion}>
      <section
        className="game-machine-card"
        aria-label={t("catalog.preview.machine")}
      >
        <div className="game-accent-line" aria-hidden="true" />
        <div className="game-toolbar">
          <div className="game-balance">
            <span>{t("game.balance.label")}</span>
            <strong>
              {view.balance === null
                ? t("game.balance.unknown")
                : new Intl.NumberFormat(i18n.language).format(
                    view.balance,
                  )}{" "}
              <small>{t("game.balance.credits")}</small>
            </strong>
          </div>
          <span className="game-connection" data-phase={view.phase}>
            {t("catalog.preview.fixed")}
          </span>
        </div>
        <GameReels view={view} reducedMotion={reducedMotion} />
        <div className="game-controls">
          <BetSelector bet={view.bet} disabled />
        </div>
        <GameMessage view={view} example />
        <p className="catalog-readonly">{t("catalog.preview.readonly")}</p>
      </section>
      <aside className="catalog-game-sidebar">
        <GameHistory history={view.history} />
        <section className="game-panel" aria-label={t("game.rules.table")}>
          <h2 className="catalog-table-title">{t("game.rules.table")}</h2>
          <Paytable bet={view.bet} />
        </section>
      </aside>
    </div>
  );
}
