"use client";

import dynamic from "next/dynamic";
import { useTranslation } from "react-i18next";

function WorkspaceLoading() {
  const { t } = useTranslation();
  return <p role="status">{t("workspace.loading")}</p>;
}

const Workspace = dynamic(
  () =>
    import("@/features/game/components/workspace").then(
      (module) => module.GameWorkspace,
    ),
  { ssr: false, loading: WorkspaceLoading },
);

export function GameEntry() {
  return <Workspace />;
}
