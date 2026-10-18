"use client";

import {
  createRootRoute,
  createRoute,
  createRouter,
  createMemoryHistory,
  Link,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { ApiStatus } from "@/features/game/components/api-status";

function WorkspaceLayout() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <nav
        aria-label={t("workspace.navigation")}
        className="flex flex-wrap gap-2"
      >
        <Button asChild variant="outline">
          <Link
            to="/"
            activeOptions={{ exact: true }}
            activeProps={{ "aria-current": "page", className: "bg-accent" }}
          >
            {t("workspace.machine.title")}
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link
            to="/rules"
            activeProps={{ "aria-current": "page", className: "bg-accent" }}
          >
            {t("workspace.rules.title")}
          </Link>
        </Button>
      </nav>
      <ApiStatus />
      <Outlet />
    </div>
  );
}

function MachinePanel() {
  const { t } = useTranslation();
  return (
    <section className="space-y-3">
      <h2 className="text-2xl font-semibold">{t("workspace.machine.title")}</h2>
      <p className="leading-relaxed text-stone-300">
        {t("workspace.machine.description")}
      </p>
    </section>
  );
}

function RulesPanel() {
  const { t } = useTranslation();
  return (
    <section className="space-y-3">
      <h2 className="text-2xl font-semibold">{t("workspace.rules.title")}</h2>
      <p className="leading-relaxed text-stone-300">
        {t("workspace.rules.description")}
      </p>
    </section>
  );
}

function createGameRouter() {
  const root = createRootRoute({ component: WorkspaceLayout });
  const machine = createRoute({
    getParentRoute: () => root,
    path: "/",
    component: MachinePanel,
  });
  const rules = createRoute({
    getParentRoute: () => root,
    path: "/rules",
    component: RulesPanel,
  });

  return createRouter({
    routeTree: root.addChildren([machine, rules]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createGameRouter>;
  }
}

export function GameWorkspace() {
  const [router] = useState(createGameRouter);
  return <RouterProvider router={router} />;
}
