import type {
  GameView,
  Reels,
  DisplayRound,
} from "@/features/game/presentation";

export const exampleScenarios = [
  "ready",
  "loading",
  "spinning",
  "win",
  "loss",
  "insufficient",
  "offline",
  "verifying",
  "failed",
] as const;
export type ExampleScenario = (typeof exampleScenarios)[number];

const initialReels: Reels = [
  ["cherry", "gem", "leaf"],
  ["leaf", "flower", "gem"],
  ["gem", "cherry", "flower"],
];
const winningReels: Reels = [
  ["cherry", "flower", "leaf"],
  ["leaf", "flower", "gem"],
  ["gem", "flower", "cherry"],
];
const history: readonly DisplayRound[] = [
  { id: 5, symbols: ["flower", "flower", "flower"], bet: 10, prize: 50 },
  { id: 4, symbols: ["leaf", "gem", "cherry"], bet: 10, prize: 0 },
  { id: 3, symbols: ["gem", "gem", "leaf"], bet: 10, prize: 0 },
  { id: 2, symbols: ["cherry", "leaf", "flower"], bet: 10, prize: 0 },
  { id: 1, symbols: ["leaf", "flower", "gem"], bet: 10, prize: 0 },
];

export function isExampleScenario(value: string): value is ExampleScenario {
  return exampleScenarios.some((scenario) => scenario === value);
}

export function createExample(scenario: ExampleScenario): GameView {
  const view: GameView = {
    phase: scenario,
    balance: 1000,
    bet: 10,
    reels: initialReels,
    stoppedReels: 3,
    history: [],
    prize: 0,
  };
  if (scenario === "win")
    return { ...view, reels: winningReels, history, prize: 50 };
  if (scenario === "loss")
    return {
      ...view,
      bet: 25,
      balance: 975,
      history: [
        { id: 1, symbols: ["gem", "flower", "cherry"], bet: 25, prize: 0 },
      ],
    };
  if (scenario === "insufficient") return { ...view, balance: 20, bet: 25 };
  if (scenario === "spinning") return { ...view, stoppedReels: 0 };
  if (
    scenario === "failed" ||
    scenario === "verifying" ||
    scenario === "loading"
  )
    return {
      ...view,
      reels: [
        [null, null, null],
        [null, null, null],
        [null, null, null],
      ],
    };
  return view;
}
