import {
  createExample,
  exampleScenarios,
} from "@/features/game/examples/scenarios";
import {
  createUnavailableView,
  type GameView,
} from "@/features/game/presentation";

export const catalogScenarios = [
  "unavailable",
  ...exampleScenarios,
  "stopping",
] as const;
export type CatalogScenario = (typeof catalogScenarios)[number];
export function isCatalogScenario(value: string): value is CatalogScenario {
  return catalogScenarios.some((scenario) => scenario === value);
}
export function createCatalogView(scenario: CatalogScenario): GameView {
  if (scenario === "unavailable") return createUnavailableView(10);
  if (scenario === "stopping")
    return {
      ...createExample("ready"),
      reels: createExample("win").reels,
      phase: "stopping",
      stoppedReels: 1,
    };
  return createExample(scenario);
}

export const previewSizes = ["compact", "medium", "fluid"] as const;
export type PreviewSize = (typeof previewSizes)[number];
export function isPreviewSize(value: string): value is PreviewSize {
  return previewSizes.some((size) => size === value);
}
export const previewWidths: Record<PreviewSize, number | undefined> = {
  compact: 320,
  medium: 768,
  fluid: undefined,
};
