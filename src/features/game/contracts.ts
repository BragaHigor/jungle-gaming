export const bets = [10, 25, 50] as const;
export type Bet = (typeof bets)[number];
export const symbols = ["leaf", "flower", "cherry", "gem"] as const;
export type GameSymbol = (typeof symbols)[number];
export type WinningLine = readonly [GameSymbol, GameSymbol, GameSymbol];

export interface Round {
  id: string;
  generation: string;
  version: number;
  sequence: number;
  bet: Bet;
  symbols: WinningLine;
  prize: number;
  balance: number;
  createdAt: string;
}

export interface GameSession {
  generation: string;
  version: number;
  balance: number;
  roundCount: number;
  expiresAt: string;
  history: Round[];
}

export interface RoundInput {
  requestId: string;
  generation: string;
  bet: Bet;
}

export interface ResetInput {
  requestId: string;
  generation: string;
  version: number;
}

export type GameErrorCode =
  | "INVALID_INPUT"
  | "SESSION_REQUIRED"
  | "SESSION_EXPIRED"
  | "SESSION_CHANGED"
  | "SESSION_LIMIT"
  | "INSUFFICIENT_BALANCE"
  | "IDEMPOTENCY_CONFLICT"
  | "ROUND_NOT_FOUND"
  | "FORBIDDEN_ORIGIN"
  | "UNSUPPORTED_MEDIA_TYPE"
  | "PAYLOAD_TOO_LARGE"
  | "GAME_UNAVAILABLE";

export interface GameApiError {
  error: { code: GameErrorCode };
}
