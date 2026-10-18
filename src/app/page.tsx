import { getTranslations } from "@/i18n/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const t = await getTranslations();

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="site-container canopy-dots flex flex-col justify-center py-20 sm:py-28"
    >
      <p className="text-sm font-medium tracking-widest text-muted-foreground uppercase">
        {t("home.eyebrow")}
      </p>
      <h1 className="hero-title text-sunset mt-5 font-script text-6xl tracking-tight sm:text-8xl">
        {t("home.title")}
      </h1>
      <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
        {t("home.description")}
      </p>
      <p className="mt-10 max-w-lg border-t border-border pt-5 text-sm text-muted-foreground">
        {t("home.disclaimer")}
      </p>
      <Button asChild className="mt-6 w-fit">
        <Link href="/play">{t("home.openWorkspace")}</Link>
      </Button>
    </main>
  );
}
