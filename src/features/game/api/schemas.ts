import { z } from "zod";
import { bets, symbols, type GameSession, type Round } from "../contracts";

const id = z.uuid({ version: "v4" });
const version = z.number().int().min(0).max(500);
const credits = z.number().int().nonnegative();
const symbol = z.enum(symbols);
export const roundSchema = z.strictObject({
  id,
  generation: id,
  version,
  sequence: z.number().int().min(1).max(500),
  bet: z.literal(bets),
  symbols: z.tuple([symbol, symbol, symbol]),
  prize: credits,
  balance: credits,
  createdAt: z.iso.datetime(),
}) satisfies z.ZodType<Round>;
export const sessionSchema = z.strictObject({
  generation: id,
  version,
  balance: credits,
  roundCount: z.number().int().min(0).max(500),
  expiresAt: z.iso.datetime(),
  history: z.array(roundSchema).max(5),
}) satisfies z.ZodType<GameSession>;
export const errorSchema = z.strictObject({
  error: z.strictObject({
    code: z.enum([
      "INVALID_INPUT",
      "SESSION_REQUIRED",
      "SESSION_EXPIRED",
      "SESSION_CHANGED",
      "SESSION_LIMIT",
      "INSUFFICIENT_BALANCE",
      "IDEMPOTENCY_CONFLICT",
      "ROUND_NOT_FOUND",
      "FORBIDDEN_ORIGIN",
      "UNSUPPORTED_MEDIA_TYPE",
      "PAYLOAD_TOO_LARGE",
      "GAME_UNAVAILABLE",
    ]),
  }),
});
