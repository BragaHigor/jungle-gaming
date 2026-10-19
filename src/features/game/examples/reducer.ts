import {
  createExample,
  type ExampleScenario,
} from "@/features/game/examples/scenarios";
import { canReset, type GameView } from "@/features/game/presentation";

export interface ExampleState {
  scenario: ExampleScenario;
  view: GameView;
  runId: number;
  transition: "spin" | "recover" | null;
  target: "win" | "loss";
}
export type ExampleAction =
  | { type: "select"; scenario: ExampleScenario }
  | { type: "animate" }
  | { type: "recover" }
  | { type: "stop-reel"; runId: number; count: number }
  | { type: "finish"; runId: number }
  | { type: "reset" };

export function createExampleState(): ExampleState {
  return {
    scenario: "ready",
    view: createExample("ready"),
    runId: 0,
    transition: null,
    target: "win",
  };
}

export function exampleReducer(
  state: ExampleState,
  action: ExampleAction,
): ExampleState {
  switch (action.type) {
    case "select":
      return {
        ...state,
        scenario: action.scenario,
        view: createExample(action.scenario),
        runId: state.runId + 1,
        transition: null,
      };
    case "animate":
      if (
        state.transition ||
        !["ready", "win", "loss"].includes(state.view.phase)
      )
        return state;
      return {
        ...state,
        runId: state.runId + 1,
        transition: "spin",
        target: state.scenario === "loss" ? "loss" : "win",
        view: { ...state.view, phase: "spinning", stoppedReels: 0 },
      };
    case "recover":
      if (state.transition || state.view.phase !== "failed") return state;
      return {
        ...state,
        runId: state.runId + 1,
        transition: "recover",
        target: "win",
        view: { ...state.view, phase: "verifying" },
      };
    case "stop-reel": {
      if (
        action.runId !== state.runId ||
        state.transition !== "spin" ||
        action.count <= state.view.stoppedReels ||
        action.count > 3
      )
        return state;
      const target = createExample(state.target);
      return {
        ...state,
        view: {
          ...state.view,
          phase: "stopping",
          stoppedReels: action.count,
          reels: target.reels,
        },
      };
    }
    case "finish":
      if (action.runId !== state.runId || !state.transition) return state;
      return {
        ...state,
        scenario: state.target,
        view: createExample(state.target),
        transition: null,
      };
    case "reset":
      if (state.transition || !canReset(state.view)) return state;
      return { ...createExampleState(), runId: state.runId + 1 };
  }
}
