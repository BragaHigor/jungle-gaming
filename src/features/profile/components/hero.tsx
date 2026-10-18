import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { profile } from "@/content/profile";
import { GamePreview } from "@/features/profile/components/game-preview";
import { getTranslations } from "@/i18n/server";

export async function Hero() {
  const t = await getTranslations();

  return (
    <section
      className="site-container landing-hero canopy-dots"
      aria-labelledby="intro-title"
    >
      <div className="landing-hero-copy">
        <p className="landing-eyebrow hero-eyebrow">
          {t("landing.hero.eyebrow")}
        </p>
        <p className="profile-signature">{profile.name}</p>
        <h1 id="intro-title" className="landing-title">
          {t("landing.hero.titleStart")}{" "}
          <span className="text-sunset">{t("landing.hero.titleAccent")}</span>{" "}
          {t("landing.hero.titleEnd")}
        </h1>
        <p className="landing-description">{t("landing.hero.description")}</p>
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Icon name="mapPin" className="shrink-0 text-highlight" />
          {t("landing.hero.location", {
            city: profile.city,
            region: profile.region,
          })}
        </p>
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
          <Link href="/project" className="landing-text-link">
            {t("landing.hero.project")}
            <Icon name="arrow" />
          </Link>
        </div>
      </div>
      <div className="hero-preview">
        <div className="sunset-disc" aria-hidden="true" />
        <GamePreview variant="hero" />
      </div>
    </section>
  );
}
