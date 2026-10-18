import { getTranslations } from "@/i18n/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const t = await getTranslations();

  return (
    <main className="mx-auto flex min-h-[calc(100svh-5rem)] w-full max-w-3xl flex-col justify-center px-6 py-16 sm:px-10">
      <p className="text-sm font-medium tracking-widest text-stone-400 uppercase">
        {t("home.eyebrow")}
      </p>
      <h1 className="mt-5 text-5xl font-semibold tracking-tight text-stone-100 sm:text-7xl">
        {t("home.title")}
      </h1>
      <p className="mt-6 max-w-lg text-lg leading-relaxed text-stone-300">
        {t("home.description")}
      </p>
      <p className="mt-10 border-t border-stone-800 pt-5 text-sm text-stone-400">
        {t("home.disclaimer")}
      </p>
      <Button asChild className="mt-6 w-fit">
        <Link href="/play">{t("home.openWorkspace")}</Link>
      </Button>
    </main>
  );
}
