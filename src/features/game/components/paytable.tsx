"use client";

import { useTranslation } from "react-i18next";
import { Icon } from "@/components/ui/icon";
import { paytable, type Bet } from "@/features/game/presentation";

export function Paytable({ bet }: { bet: Bet }) {
  const { t, i18n } = useTranslation();
  const fmt = new Intl.NumberFormat(i18n.language);
  return (
    <>
      <table className="game-paytable">
        <caption className="sr-only">{t("game.rules.table")}</caption>
        <thead>
          <tr>
            <th scope="col">{t("game.rules.line")}</th>
            <th scope="col">{t("game.rules.prize")}</th>
            <th scope="col">
              {t("game.rules.withBet", { bet: fmt.format(bet) })}
            </th>
          </tr>
        </thead>
        <tbody>
          {paytable.map(({ symbol, multiplier }) => (
            <tr key={symbol}>
              <th scope="row">
                <span className="game-paytable-symbols">
                  <span aria-hidden="true" className={`symbol-${symbol}`}>
                    {[0, 1, 2].map((i) => (
                      <Icon key={i} name={symbol} />
                    ))}
                  </span>
                  <span>{t(`game.rules.matches.${symbol}`)}</span>
                </span>
              </th>
              <td>
                {fmt.format(multiplier)}
                {t("game.rules.times")}
              </td>
              <td>{fmt.format(bet * multiplier)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="game-rules-note">{t("game.rules.note")}</p>
    </>
  );
}
