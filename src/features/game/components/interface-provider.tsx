"use client";

import { createContext, useContext, type ReactNode } from "react";
import {
  useGameInterface,
  type GameInterface,
} from "@/features/game/hooks/use-game-interface";

const InterfaceContext = createContext<GameInterface | null>(null);

export function InterfaceProvider({ children }: { children: ReactNode }) {
  const controller = useGameInterface();
  return <InterfaceContext value={controller}>{children}</InterfaceContext>;
}

export function useInterface() {
  const controller = useContext(InterfaceContext);
  if (!controller) throw new Error("Game interface provider is missing");
  return controller;
}
