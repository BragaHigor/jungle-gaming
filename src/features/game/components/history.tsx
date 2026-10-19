"use client";

import { useTranslation } from "react-i18next";
import { Icon } from "@/components/ui/icon";
import type { DisplayRound } from "@/features/game/presentation";

export function GameHistory({ history }: { history: readonly DisplayRound[] }) {
  const { t, i18n } = useTranslation();
  const fmt = new Intl.NumberFormat(i18n.language);
  return (
    <section className="game-panel" aria-labelledby="game-history-title">
      <div className="game-panel-heading">
        <h2 id="game-history-title">{t("game.history.title")}</h2>
        <span>{t("game.history.limit")}</span>
      </div>
      {history.length === 0 ? (
        <div className="game-history-empty">
          <Icon name="history" />
          <p>{t("game.history.empty")}</p>
        </div>
      ) : (
        <ol className="game-history">
          {history.slice(0, 5).map((round) => (
            <li key={round.id}>
              <span className="game-history-number">
                {t("game.history.number", {
                  number: String(round.id).padStart(3, "0"),
                })}
              </span>
              <div>
                <span
                  className="game-history-symbols"
                  role="img"
                  aria-label={round.symbols
                    .map((symbol) => t(`game.symbols.${symbol}`))
                    .join(", ")}
                >
                  {round.symbols.map((symbol, index) => (
                    <Icon
                      key={index}
                      name={symbol}
                      className={`symbol-${symbol}`}
                    />
                  ))}
                </span>
                <p>{t("game.history.bet", { bet: fmt.format(round.bet) })}</p>
              </div>
              <span
                className={
                  round.prize > 0 ? "text-success" : "text-muted-foreground"
                }
              >
                {round.prize > 0
                  ? t("game.history.prize", { prize: fmt.format(round.prize) })
                  : t("game.history.noPrize")}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
