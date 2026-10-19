"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { getHealth } from "@/features/game/api/health";

export function ApiStatus() {
  const { t } = useTranslation();
  const query = useQuery({
    queryKey: ["health"],
    queryFn: ({ signal }) => getHealth(signal),
  });

  return (
    <section className="flex flex-wrap items-center justify-between gap-4 rounded-md border border-border p-4">
      <p role="status">
        {query.isPending
          ? t("workspace.api.loading")
          : query.isError
            ? t("workspace.api.error")
            : t("workspace.api.success")}
      </p>
      <Button
        variant="outline"
        disabled={query.isFetching}
        onClick={() => void query.refetch()}
      >
        {query.isFetching
          ? t("workspace.api.checking")
          : t("workspace.api.check")}
      </Button>
    </section>
  );
}
