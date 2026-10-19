import {
  bets,
  type Bet,
  type GameSymbol,
  type WinningLine,
} from "@/features/game/contracts";
import { GameError } from "./errors";

export const initialBalance = 1_000;
export const sessionLifetimeMs = 24 * 60 * 60 * 1_000;
export const maxSessionOperations = 500;
export const multipliers: Record<GameSymbol, number> = {
  leaf: 3,
  flower: 5,
  cherry: 8,
  gem: 15,
};

export function validateBet(value: unknown): Bet {
  if (typeof value !== "number" || !bets.includes(value as Bet)) {
    throw new GameError("INVALID_INPUT");
  }
  return value as Bet;
}

export function calculatePrize(bet: Bet, line: WinningLine) {
  return line.every((symbol) => symbol === line[0])
    ? bet * multipliers[line[0]]
    : 0;
}

export function settleRound(balance: number, bet: Bet, line: WinningLine) {
  validateBet(bet);
  if (balance < bet) throw new GameError("INSUFFICIENT_BALANCE");
  const prize = calculatePrize(bet, line);
  return { prize, balance: balance - bet + prize };
}
