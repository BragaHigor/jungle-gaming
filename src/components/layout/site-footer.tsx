import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { profile } from "@/content/profile";
import { getTranslations } from "@/i18n/server";

export async function SiteFooter() {
  const t = await getTranslations();

  return (
    <footer className="site-footer">
      <div className="site-container footer-inner">
        <div>
          <p className="text-[1.625rem] leading-tight font-semibold">
            {profile.name}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <a
                href={profile.github}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon name="github" />
                {t("social.github")}
              </a>
            </Button>
            <Button asChild variant="outline">
              <a
                href={profile.linkedin}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon name="linkedin" />
                {t("social.linkedin")}
              </a>
            </Button>
          </div>
        </div>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>{t("footer.independent")}</li>
          <li>{t("footer.affiliation")}</li>
          <li>{t("footer.credits")}</li>
        </ul>
      </div>
    </footer>
  );
}
