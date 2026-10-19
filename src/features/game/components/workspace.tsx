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
import { GameBoard } from "@/features/game/components/game-board";
import { BetSelector } from "@/features/game/components/bet-selector";
import { Paytable } from "@/features/game/components/paytable";
import { ExamplePanel } from "@/features/game/components/example-panel";
import {
  InterfaceProvider,
  useInterface,
} from "@/features/game/components/interface-provider";
import { createUnavailableView } from "@/features/game/presentation";

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
        <Button asChild variant="outline">
          <Link
            to="/examples"
            activeProps={{ "aria-current": "page", className: "bg-accent" }}
          >
            {t("game.navigation.examples")}
          </Link>
        </Button>
      </nav>
      <Outlet />
    </div>
  );
}

function MachinePanel() {
  const controller = useInterface();
  return <GameBoard view={createUnavailableView(controller.bet)} />;
}

function RulesPanel() {
  const { t } = useTranslation();
  const controller = useInterface();
  return (
    <section className="game-panel game-full-rules space-y-5">
      <h2>{t("game.rules.title")}</h2>
      <p className="leading-relaxed text-muted-foreground">
        {t("game.rules.intro")}
      </p>
      <BetSelector bet={controller.bet} onChange={controller.setBet} />
      <Paytable bet={controller.bet} />
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
  const examples = createRoute({
    getParentRoute: () => root,
    path: "/examples",
    component: ExamplePanel,
  });
  return createRouter({
    routeTree: root.addChildren([machine, rules, examples]),
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
  return (
    <InterfaceProvider>
      <RouterProvider router={router} />
    </InterfaceProvider>
  );
}
