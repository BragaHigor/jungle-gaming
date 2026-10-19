"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { BetSelector } from "@/features/game/components/bet-selector";
import { ResetDialog } from "@/features/game/components/game-dialogs";
import { Paytable } from "@/features/game/components/paytable";
import type { Bet } from "@/features/game/presentation";

export function SystemControls() {
  const { t } = useTranslation();
  const [bet, setBet] = useState<Bet>(10);
  const [action, setAction] = useState<
    "initial" | "default" | "outline" | "ghost" | "reset"
  >("initial");
  return (
    <div className="catalog-system-controls">
      <div className="catalog-button-row">
        {(["default", "outline", "ghost"] as const).map((variant) => (
          <Button
            key={variant}
            variant={variant}
            onClick={() => setAction(variant)}
          >
            {t(`catalog.system.buttons.${variant}`)}
          </Button>
        ))}
        <Button disabled>{t("catalog.system.buttons.disabled")}</Button>
        <Button disabled variant="outline">
          <Icon name="loader" />
          {t("catalog.system.buttons.loading")}
        </Button>
      </div>
      <p role="status" className="catalog-feedback">
        {t(`catalog.system.feedback.${action}`)}
      </p>
      <div className="catalog-control-grid">
        <div>
          <BetSelector bet={bet} onChange={setBet} />
          <p className="catalog-help">{t("catalog.system.betNote")}</p>
          <ResetDialog
            disabled={false}
            example
            description={t("catalog.system.resetDescription")}
            onReset={() => {
              setBet(10);
              setAction("reset");
            }}
          />
        </div>
        <section className="game-panel" aria-label={t("game.rules.table")}>
          <h3 className="catalog-table-title">{t("game.rules.table")}</h3>
          <Paytable bet={bet} />
        </section>
      </div>
    </div>
  );
}
