import "server-only";
import { createHash, randomBytes, randomInt, randomUUID } from "node:crypto";
import { Pool } from "pg";
import { symbols } from "@/features/game/contracts";
import { GameError } from "./errors";
import { createGameService } from "./game-service";
import { createPostgresRepository } from "./storage";

const databaseGlobal = globalThis as typeof globalThis & { gamePool?: Pool };

export function getGameService() {
  if (!process.env.DATABASE_URL) throw new GameError("GAME_UNAVAILABLE");
  if (!databaseGlobal.gamePool) {
    databaseGlobal.gamePool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 3,
      connectionTimeoutMillis: 5_000,
      idleTimeoutMillis: 10_000,
      allowExitOnIdle: true,
    });
    // An idle connection can fail independently of a request; never log credentials.
    databaseGlobal.gamePool.on("error", () => {
      console.error("GAME_DATABASE_CONNECTION_ERROR");
    });
  }
  return createGameService({
    repository: createPostgresRepository(databaseGlobal.gamePool),
    draw: () => [
      symbols[randomInt(symbols.length)],
      symbols[randomInt(symbols.length)],
      symbols[randomInt(symbols.length)],
    ],
    newId: randomUUID,
  });
}

export function newSessionToken() {
  return randomBytes(32).toString("hex");
}

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
