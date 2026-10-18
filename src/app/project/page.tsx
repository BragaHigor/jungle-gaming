import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getTranslations } from "@/i18n/server";

export default async function ProjectPage() {
  const t = await getTranslations();
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="site-container py-16 sm:py-24"
    >
      <div className="max-w-2xl space-y-6">
        <h1 className="text-4xl font-medium sm:text-5xl">
          {t("project.title")}
        </h1>
        <p className="text-lg leading-relaxed text-muted-foreground">
          {t("project.pending")}
        </p>
        <Button asChild variant="outline">
          <Link href="/">{t("notFound.backHome")}</Link>
        </Button>
      </div>
    </main>
  );
}
