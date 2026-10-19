import { z } from "zod";
import type { GameSession, Round } from "./contracts";
import { bets } from "./contracts";
import { GameRequestError, getRound, getSession } from "./api/session";

const id = z.uuid({ version: "v4" });
const pendingSchema = z.discriminatedUnion("kind", [
  z.strictObject({
    kind: z.literal("round"),
    input: z.strictObject({
      requestId: id,
      generation: id,
      bet: z.literal(bets),
    }),
  }),
  z.strictObject({
    kind: z.literal("reset"),
    input: z.strictObject({
      requestId: id,
      generation: id,
      version: z.number().int().min(0).max(500),
    }),
  }),
]);
export type PendingCommand = z.infer<typeof pendingSchema>;
export const pendingStorageKey = "canopy-pending-v1";

export function readPending(
  storage: Pick<Storage, "getItem">,
): PendingCommand | null {
  const raw = storage.getItem(pendingStorageKey);
  if (raw === null) return null;
  return pendingSchema.parse(JSON.parse(raw));
}
export function savePending(
  storage: Pick<Storage, "setItem">,
  command: PendingCommand,
) {
  storage.setItem(pendingStorageKey, JSON.stringify(command));
}

export function applyRound(
  current: GameSession | undefined,
  round: Round,
): GameSession | undefined {
  if (
    !current ||
    current.generation !== round.generation ||
    current.version >= round.version
  )
    return current;
  return {
    ...current,
    version: round.version,
    balance: round.balance,
    roundCount: round.sequence,
    history: [round, ...current.history.filter((r) => r.id !== round.id)].slice(
      0,
      5,
    ),
  };
}

interface RecoveryApi {
  getRound: (id: string, signal?: AbortSignal) => Promise<Round>;
  getSession: (signal?: AbortSignal) => Promise<GameSession>;
}
// Read-only recovery. A 404 can precede the original POST's commit.
export async function recoverCommand(
  command: PendingCommand,
  signal?: AbortSignal,
  api: RecoveryApi = { getRound, getSession },
) {
  let round: Round | undefined;
  if (command.kind === "round") {
    try {
      round = await api.getRound(command.input.requestId, signal);
      if (
        round.generation !== command.input.generation ||
        round.bet !== command.input.bet
      ) {
        throw new GameRequestError("IDEMPOTENCY_CONFLICT");
      }
    } catch (error) {
      if (
        !(error instanceof GameRequestError) ||
        error.code !== "ROUND_NOT_FOUND"
      )
        throw error;
    }
  }
  const session = await api.getSession(signal);
  const resolved =
    !!round ||
    session.generation !== command.input.generation ||
    (command.kind === "reset" && session.version > command.input.version);
  return { session, resolved };
}
