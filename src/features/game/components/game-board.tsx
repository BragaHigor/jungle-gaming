"use client";

import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { BetSelector } from "@/features/game/components/bet-selector";
import { GameReels } from "@/features/game/components/reels";
import { GameHistory } from "@/features/game/components/history";
import { GameMessage } from "@/features/game/components/game-message";
import { Paytable } from "@/features/game/components/paytable";
import {
  ResetDialog,
  RulesDialog,
} from "@/features/game/components/game-dialogs";
import { useInterface } from "@/features/game/components/interface-provider";
import { SessionControls } from "./session-controls";
import { canReset, isBusy, type GameView } from "@/features/game/presentation";

export function GameBoard({
  view,
  example = false,
}: {
  view: GameView;
  example?: boolean;
}) {
  const { t, i18n } = useTranslation();
  const controller = useInterface();
  const fmt = new Intl.NumberFormat(i18n.language);
  const connectionStatus = !example
    ? controller.remote.pending
      ? "verifying"
      : controller.remote.authenticationRequired
        ? "unavailable"
        : controller.remote.error
          ? "failed"
          : controller.remote.busy
            ? "loading"
            : controller.remote.session
              ? "http"
              : "unavailable"
    : view.phase === "offline"
      ? "offline"
      : view.phase === "failed"
        ? "failed"
        : view.phase === "verifying"
          ? "verifying"
          : view.phase === "loading"
            ? "loading"
            : "example";
  const busy = example ? isBusy(view.phase) : controller.remote.busy;
  const canAnimate =
    example &&
    ["ready", "win", "loss"].includes(view.phase) &&
    !controller.example.transition;
  return (
    <div className="game-grid" data-reduced-motion={controller.reducedMotion}>
      <section className="game-machine" aria-label={t("game.machine")}>
        <div className="game-machine-card">
          <div className="game-accent-line" aria-hidden="true" />
          <div className="game-toolbar">
            <div className="game-balance">
              <span>{t("game.balance.label")}</span>
              <strong>
                {view.balance === null
                  ? t("game.balance.unknown")
                  : fmt.format(view.balance)}{" "}
                <small>{t("game.balance.credits")}</small>
              </strong>
            </div>
            <span className="game-connection" data-phase={view.phase}>
              {t(`game.status.${connectionStatus}`)}
            </span>
            <Button
              variant="outline"
              onClick={() => void controller.sound.toggle()}
              disabled={controller.sound.pending}
              aria-pressed={controller.sound.enabled}
            >
              <Icon name={controller.sound.enabled ? "volume" : "mute"} />
              {t(controller.sound.enabled ? "game.sound.on" : "game.sound.off")}
            </Button>
          </div>
          <GameReels view={view} reducedMotion={controller.reducedMotion} />
          <div className="game-controls">
            <BetSelector
              bet={view.bet}
              disabled={example || busy || !!controller.remote.pending}
              onChange={controller.setBet}
            />
            <Button
              className="game-spin"
              disabled={example ? !canAnimate : !controller.remote.canPlay}
              aria-busy={busy}
              aria-describedby="game-message"
              onClick={() =>
                example
                  ? controller.dispatch({ type: "animate" })
                  : void controller.remote.spin()
              }
            >
              <Icon
                name={busy ? "loader" : "reset"}
                className={busy ? "game-loading-icon" : undefined}
              />
              {t(
                busy
                  ? ["spinning", "stopping"].includes(view.phase)
                    ? "game.actions.spinning"
                    : "game.api.checking"
                  : example
                    ? "game.actions.animateExample"
                    : "game.actions.spin",
              )}
            </Button>
          </div>
          <GameMessage
            view={view}
            example={example}
            onRecover={
              example
                ? () => controller.dispatch({ type: "recover" })
                : undefined
            }
          />
          {!example && <SessionControls />}
        </div>
        {controller.sound.unavailable && (
          <p role="status" className="game-sound-error">
            {t("game.sound.unavailable")}
          </p>
        )}
        <div className="game-machine-actions">
          <RulesDialog bet={view.bet} />
          <ResetDialog
            disabled={
              example
                ? !canReset(view) || !!controller.example.transition
                : !controller.remote.canReset
            }
            example={example}
            onReset={() =>
              example
                ? controller.dispatch({ type: "reset" })
                : void controller.remote.reset()
            }
          />
        </div>
      </section>
      <aside className="game-sidebar">
        <GameHistory history={view.history} />
        <section
          className="game-panel game-desktop-rules"
          aria-labelledby="game-combinations-title"
        >
          <h2 id="game-combinations-title">{t("game.rules.title")}</h2>
          <Paytable bet={view.bet} />
        </section>
      </aside>
    </div>
  );
}
