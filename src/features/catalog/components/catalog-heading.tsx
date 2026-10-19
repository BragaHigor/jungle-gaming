import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { getTranslations } from "@/i18n/server";

export async function CatalogHeading({
  page,
}: {
  page: "system" | "showcase";
}) {
  const t = await getTranslations();
  return (
    <header className="catalog-heading">
      <p className="catalog-eyebrow">{t("catalog.eyebrow")}</p>
      <h1>{t(`catalog.${page}.title`)}</h1>
      <p className="catalog-intro">{t(`catalog.${page}.intro`)}</p>
      <div className="catalog-links">
        <Button asChild variant="outline">
          <Link href={page === "system" ? "/showcase" : "/system"}>
            {t(
              page === "system"
                ? "catalog.links.showcase"
                : "catalog.links.system",
            )}
            <Icon name="arrow" />
          </Link>
        </Button>
        <Link href="/project">{t("catalog.links.project")}</Link>
      </div>
    </header>
  );
}
