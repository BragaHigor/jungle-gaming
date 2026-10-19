"use client";

import { useId } from "react";
import { useTranslation } from "react-i18next";
import { bets, type Bet } from "@/features/game/presentation";

export function BetSelector({
  bet,
  disabled = false,
  onChange,
}: {
  bet: Bet;
  disabled?: boolean;
  onChange?: (bet: Bet) => void;
}) {
  const { t, i18n } = useTranslation();
  const name = useId();
  return (
    <fieldset className="game-bet" disabled={disabled}>
      <legend>{t("game.bet.label")}</legend>
      <div className="game-bet-options">
        {bets.map((value) => (
          <label key={value} data-selected={bet === value}>
            <input
              type="radio"
              name={name}
              value={value}
              checked={bet === value}
              onChange={() => onChange?.(value)}
            />
            <span>{new Intl.NumberFormat(i18n.language).format(value)}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
