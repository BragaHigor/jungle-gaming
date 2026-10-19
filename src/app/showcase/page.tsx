import type { Metadata } from "next";
import { CatalogHeading } from "@/features/catalog/components/catalog-heading";
import { StateGallery } from "@/features/catalog/components/state-gallery";
import { getTranslations } from "@/i18n/server";
import "@/features/game/game.css";
import "@/features/catalog/catalog.css";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: t("catalog.showcase.metadataTitle"),
    description: t("catalog.showcase.intro"),
  };
}
export default function ShowcasePage() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="site-container catalog-page"
    >
      <CatalogHeading page="showcase" />
      <StateGallery />
    </main>
  );
}
