"use client";

import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useInterface } from "./interface-provider";

export function SessionControls() {
  const { t } = useTranslation();
  const { remote } = useInterface();
  return (
    <div className="game-session-controls">
      {remote.error && (
        <p role="status">{t(`game.api.errors.${remote.error}`)}</p>
      )}
      {remote.pending && !remote.busy && !remote.authenticationRequired && (
        <p>{t("game.api.pending")}</p>
      )}
      <div className="flex flex-wrap gap-2">
        {remote.authenticationRequired ? (
          <Button disabled={remote.busy} onClick={() => void remote.start()}>
            {t("game.api.start")}
          </Button>
        ) : (
          <>
            <Button
              variant="outline"
              disabled={remote.busy}
              onClick={() => void remote.verify()}
            >
              {t(remote.pending ? "game.api.verify" : "game.api.refresh")}
            </Button>
            {remote.pending && (
              <Button
                variant="outline"
                disabled={remote.busy}
                onClick={() => void remote.retry()}
              >
                {t("game.api.retry")}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
