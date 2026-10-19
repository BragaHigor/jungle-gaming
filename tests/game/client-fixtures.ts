import type { GameSession, Round } from "@/features/game/contracts";

export const generation = "11111111-1111-4111-8111-111111111111";
export const round: Round = {
  id: "22222222-2222-4222-8222-222222222222",
  generation,
  version: 1,
  sequence: 1,
  bet: 25,
  symbols: ["flower", "flower", "flower"],
  prize: 125,
  balance: 1100,
  createdAt: "2026-10-18T12:00:00.000Z",
};
export const session: GameSession = {
  generation,
  version: 0,
  balance: 1000,
  roundCount: 0,
  expiresAt: "2026-10-19T12:00:00.000Z",
  history: [],
};
