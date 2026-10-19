"use client";

import { useTranslation } from "react-i18next";
import { Icon } from "@/components/ui/icon";
import { symbols, type GameView } from "@/features/game/presentation";

const strip = Array.from(
  { length: 24 },
  (_, index) => symbols[(index * 3) % symbols.length],
);

export function GameReels({
  view,
  reducedMotion,
}: {
  view: GameView;
  reducedMotion: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className="game-reel-area" data-reduced-motion={reducedMotion}>
      <div className="game-reels">
        {view.reels.map((reel, index) => {
          const spinning =
            (view.phase === "spinning" || view.phase === "stopping") &&
            index >= view.stoppedReels;
          const label = spinning
            ? t("game.reel.spinning", { number: index + 1 })
            : reel[1]
              ? t("game.reel.value", {
                  number: index + 1,
                  symbol: t(`game.symbols.${reel[1]}`),
                })
              : t("game.reel.unknown", { number: index + 1 });
          return (
            <div
              key={index}
              className="game-reel"
              role="img"
              aria-label={label}
            >
              <div
                aria-hidden="true"
                className={
                  spinning && !reducedMotion
                    ? "game-reel-strip"
                    : "game-reel-still"
                }
                data-winning={view.phase === "win"}
                style={
                  spinning && !reducedMotion
                    ? { animationDelay: `-${index * 230}ms` }
                    : undefined
                }
              >
                {spinning && !reducedMotion
                  ? strip.map((symbol, i) => (
                      <span key={i} className={`game-cell symbol-${symbol}`}>
                        <Icon name={symbol} />
                      </span>
                    ))
                  : reel.map((symbol, row) => (
                      <span
                        key={row}
                        className={`game-cell${row === 1 ? " game-cell-center" : ""}${symbol ? ` symbol-${symbol}` : ""}`}
                      >
                        {spinning || !symbol ? (
                          <Icon name="question" className="game-unknown" />
                        ) : (
                          <Icon name={symbol} />
                        )}
                      </span>
                    ))}
              </div>
              <span className="game-reel-shade" aria-hidden="true" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
