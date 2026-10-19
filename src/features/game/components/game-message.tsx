"use client";

import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import type { GameView } from "@/features/game/presentation";

export function GameMessage({
  view,
  onRecover,
  example = true,
}: {
  view: GameView;
  onRecover?: () => void;
  example?: boolean;
}) {
  const { t, i18n } = useTranslation();
  const fmt = new Intl.NumberFormat(i18n.language);
  return (
    <div
      id="game-message"
      className="game-message"
      data-phase={view.phase}
      aria-live="polite"
      aria-atomic="true"
    >
      <Icon
        name={
          view.phase === "win"
            ? "flower"
            : view.phase === "insufficient"
              ? "coins"
              : "info"
        }
        className="shrink-0"
      />
      <div>
        <h3>
          {t(
            `game.${example ? "messages" : "liveMessages"}.${view.phase}.title`,
            {
              prize: fmt.format(view.prize),
            },
          )}
        </h3>
        <p>
          {t(
            `game.${example ? "messages" : "liveMessages"}.${view.phase}.body`,
            {
              bet: fmt.format(view.bet),
              balance:
                view.balance === null
                  ? t("game.balance.unknown")
                  : fmt.format(view.balance),
            },
          )}
        </p>
        {view.phase === "failed" && onRecover && (
          <Button variant="outline" onClick={onRecover} className="mt-3">
            {t("game.actions.recoverExample")}
          </Button>
        )}
      </div>
    </div>
  );
}
