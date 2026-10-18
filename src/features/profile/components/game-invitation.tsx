import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { GamePreview } from "@/features/profile/components/game-preview";
import { getTranslations } from "@/i18n/server";

const features = [
  { id: "credits", icon: "coins" },
  { id: "responsive", icon: "devices" },
  { id: "history", icon: "history" },
] as const;

export async function GameInvitation() {
  const t = await getTranslations();
  return (
    <section
      className="landing-section bg-surface"
      aria-labelledby="game-title"
    >
      <div className="site-container landing-section-inner invitation-grid">
        <div className="min-w-0 space-y-5">
          <p className="landing-eyebrow text-highlight">
            {t("landing.game.eyebrow")}
          </p>
          <h2 id="game-title" className="script-wordmark text-highlight">
            {t("landing.game.name")}
          </h2>
          <p className="landing-description">{t("landing.game.description")}</p>
          <ul>
            {features.map((feature) => (
              <li key={feature.id} className="game-feature">
                <Icon
                  name={feature.icon}
                  className="mt-1 shrink-0 text-highlight"
                />
                <div>
                  <h3 className="font-semibold">
                    {t(`landing.game.features.${feature.id}.title`)}
                  </h3>
                  <p className="mt-1 text-[15px] leading-relaxed text-muted-foreground">
                    {t(`landing.game.features.${feature.id}.description`)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <div className="landing-actions">
            <Button
              asChild
              className="min-h-13 px-3 text-sm sm:px-6 sm:text-base"
            >
              <Link href="/play">
                <Icon name="play" />
                {t("landing.hero.demo")}
              </Link>
            </Button>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Icon name="shield" className="shrink-0 text-success" />
              {t("landing.game.disclaimer")}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            {t("landing.game.progress")}
          </p>
        </div>
        <GamePreview variant="detail" />
      </div>
    </section>
  );
}
