import Link from "next/link";

import { Button } from "@/components/ui/button";
import { GameEntry } from "@/features/game/components/game-entry";
import { getTranslations } from "@/i18n/server";
import { Icon } from "@/components/ui/icon";
import "@/features/game/game.css";

export default async function PlayPage() {
  const t = await getTranslations();

  return (
    <main id="main-content" tabIndex={-1} className="site-container game-page">
      <div className="game-page-heading">
        <div className="space-y-2">
          <h1 className="game-wordmark">{t("workspace.title")}</h1>
          <p className="max-w-xl leading-relaxed text-muted-foreground">
            {t("game.description")}
          </p>
        </div>
        <p className="game-disclaimer">
          <Icon name="shield" />
          {t("game.disclaimer")}
        </p>
      </div>
      <GameEntry />
      <Button asChild variant="ghost" className="mt-auto w-fit">
        <Link href="/">{t("workspace.backHome")}</Link>
      </Button>
    </main>
  );
}
