export const bets = [10, 25, 50] as const;
export type Bet = (typeof bets)[number];
export const symbols = ["leaf", "flower", "cherry", "gem"] as const;
export type GameSymbol = (typeof symbols)[number];
export type Reel = readonly [
  GameSymbol | null,
  GameSymbol | null,
  GameSymbol | null,
];
export type Reels = readonly [Reel, Reel, Reel];

export const paytable = [
  { symbol: "gem", multiplier: 15 },
  { symbol: "cherry", multiplier: 8 },
  { symbol: "flower", multiplier: 5 },
  { symbol: "leaf", multiplier: 3 },
] as const;

export type GamePhase =
  | "unavailable"
  | "loading"
  | "ready"
  | "spinning"
  | "stopping"
  | "win"
  | "loss"
  | "insufficient"
  | "offline"
  | "verifying"
  | "failed";
export interface DisplayRound {
  id: number;
  symbols: readonly [GameSymbol, GameSymbol, GameSymbol];
  bet: Bet;
  prize: number;
}
export interface GameView {
  phase: GamePhase;
  balance: number | null;
  bet: Bet;
  reels: Reels;
  stoppedReels: number;
  history: readonly DisplayRound[];
  prize: number;
}

export function isBusy(phase: GamePhase) {
  return ["loading", "spinning", "stopping", "verifying"].includes(phase);
}

export function canReset(view: GameView) {
  return (
    !isBusy(view.phase) &&
    view.phase !== "failed" &&
    view.phase !== "unavailable"
  );
}

export function createUnavailableView(bet: Bet): GameView {
  return {
    phase: "unavailable",
    balance: null,
    bet,
    reels: [
      [null, null, null],
      [null, null, null],
      [null, null, null],
    ],
    stoppedReels: 3,
    history: [],
    prize: 0,
  };
}
