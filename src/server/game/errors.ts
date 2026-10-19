import type { GameErrorCode } from "@/features/game/contracts";

export class GameError extends Error {
  constructor(public readonly code: GameErrorCode) {
    super(code);
    this.name = "GameError";
  }
}
