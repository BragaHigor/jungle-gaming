"use client";

import { useTranslation } from "react-i18next";
import { Icon } from "@/components/ui/icon";
import { GameBoard } from "@/features/game/components/game-board";
import { useInterface } from "@/features/game/components/interface-provider";
import {
  exampleScenarios,
  isExampleScenario,
} from "@/features/game/examples/scenarios";

export function ExamplePanel() {
  const { t } = useTranslation();
  const controller = useInterface();
  return (
    <div className="space-y-6">
      <section
        className="game-example-panel"
        aria-labelledby="game-examples-title"
      >
        <div>
          <h2 id="game-examples-title">{t("game.examples.title")}</h2>
          <p>{t("game.examples.description")}</p>
        </div>
        <div className="game-example-controls">
          <label>
            <span>{t("game.examples.scenario")}</span>
            <span className="game-example-select">
              <select
                value={controller.example.scenario}
                onChange={(event) => {
                  if (isExampleScenario(event.target.value))
                    controller.dispatch({
                      type: "select",
                      scenario: event.target.value,
                    });
                }}
              >
                {exampleScenarios.map((scenario) => (
                  <option key={scenario} value={scenario}>
                    {t(`game.examples.scenarios.${scenario}`)}
                  </option>
                ))}
              </select>
              <Icon name="chevronDown" />
            </span>
          </label>
          <label className="game-motion-toggle">
            <input
              type="checkbox"
              checked={controller.reduceExample}
              onChange={(event) =>
                controller.setReduceExample(event.target.checked)
              }
            />
            {t("game.examples.reduceMotion")}
          </label>
        </div>
      </section>
      <GameBoard view={controller.example.view} example />
    </div>
  );
}
