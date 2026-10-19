import { z } from "zod";
import {
  bets,
  type ResetInput,
  type RoundInput,
} from "@/features/game/contracts";
import { GameError } from "./errors";

export const idSchema = z
  .uuid({ version: "v4" })
  .transform((id) => id.toLowerCase());
export const sessionTokenSchema = z.string().regex(/^[a-f0-9]{64}$/);
export const createSessionSchema = z.strictObject({});
export const roundInputSchema = z.strictObject({
  requestId: idSchema,
  generation: idSchema,
  bet: z.literal(bets),
}) satisfies z.ZodType<RoundInput>;
export const resetInputSchema = z.strictObject({
  requestId: idSchema,
  generation: idSchema,
  version: z.number().int().min(0).max(500),
}) satisfies z.ZodType<ResetInput>;

export function parseInput<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new GameError("INVALID_INPUT");
  return result.data;
}
