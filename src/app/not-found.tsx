import Link from "next/link";

import { getTranslations } from "@/i18n/server";

export default async function NotFoundPage() {
  const t = await getTranslations();

  return (
    <main className="mx-auto flex min-h-[calc(100svh-5rem)] max-w-3xl flex-col justify-center gap-6 px-6 py-16 sm:px-10">
      <h1 className="text-4xl font-semibold">{t("notFound.title")}</h1>
      <p className="text-lg text-stone-300">{t("notFound.description")}</p>
      <Link
        href="/"
        className="w-fit py-3 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4"
      >
        {t("notFound.backHome")}
      </Link>
    </main>
  );
}
