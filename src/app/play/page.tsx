import Link from "next/link";

import { Button } from "@/components/ui/button";
import { GameEntry } from "@/features/game/components/game-entry";
import { getTranslations } from "@/i18n/server";

export default async function PlayPage() {
  const t = await getTranslations();

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-12 sm:px-10"
    >
      <div className="space-y-3">
        <h1 className="text-4xl font-semibold">{t("workspace.title")}</h1>
        <p className="leading-relaxed text-muted-foreground">
          {t("workspace.description")}
        </p>
      </div>
      <GameEntry />
      <Button asChild variant="ghost" className="mt-auto w-fit">
        <Link href="/">{t("workspace.backHome")}</Link>
      </Button>
    </main>
  );
}
