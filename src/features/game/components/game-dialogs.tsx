"use client";

import { AlertDialog, Dialog } from "radix-ui";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Paytable } from "@/features/game/components/paytable";
import type { Bet } from "@/features/game/presentation";

export function RulesDialog({ bet }: { bet: Bet }) {
  const { t } = useTranslation();
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button variant="ghost" className="game-mobile-rules">
          <Icon name="list" />
          {t("game.rules.table")}
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="game-dialog-overlay" />
        <Dialog.Content className="game-dialog">
          <div className="game-dialog-heading">
            <Dialog.Title>{t("game.rules.table")}</Dialog.Title>
            <Dialog.Close asChild>
              <Button
                size="icon"
                variant="ghost"
                aria-label={t("game.actions.close")}
              >
                <Icon name="close" />
              </Button>
            </Dialog.Close>
          </div>
          <Dialog.Description className="game-dialog-description">
            {t("game.rules.description", { bet })}
          </Dialog.Description>
          <Paytable bet={bet} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function ResetDialog({
  disabled,
  onReset,
}: {
  disabled: boolean;
  onReset: () => void;
}) {
  const { t } = useTranslation();
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger asChild>
        <Button variant="ghost" disabled={disabled}>
          <Icon name="reset" />
          {t("game.actions.resetExample")}
        </Button>
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="game-dialog-overlay" />
        <AlertDialog.Content className="game-dialog">
          <AlertDialog.Title className="game-dialog-title">
            {t("game.reset.title")}
          </AlertDialog.Title>
          <AlertDialog.Description className="game-dialog-description">
            {t("game.reset.description")}
          </AlertDialog.Description>
          <div className="game-dialog-actions">
            <AlertDialog.Cancel asChild>
              <Button variant="outline">{t("game.actions.cancel")}</Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <Button onClick={onReset}>
                {t("game.actions.confirmReset")}
              </Button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
