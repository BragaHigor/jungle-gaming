import { GameError } from "@/server/game/errors";
import type { Round } from "@/features/game/contracts";
import type {
  GameRepository,
  ResetRecord,
  SessionRecord,
} from "@/server/game/game-repository";

// Unit tests only. Concurrency and SQL are verified against PostgreSQL separately.
export function memoryRepository(now: () => Date = () => new Date()) {
  const sessions = new Map<string, SessionRecord>();
  const rounds = new Map<string, Map<string, Round>>();
  const resets = new Map<string, Map<string, ResetRecord>>();
  const repository: GameRepository = {
    async createSession(session, lifetimeMs) {
      const stored = {
        ...session,
        expiresAt: new Date(now().getTime() + lifetimeMs).toISOString(),
      };
      sessions.set(session.tokenHash, structuredClone(stored));
      rounds.set(session.tokenHash, new Map());
      resets.set(session.tokenHash, new Map());
      return structuredClone(stored);
    },
    async withSession(hash, work) {
      const stored = sessions.get(hash);
      if (!stored) throw new GameError("SESSION_REQUIRED");
      const session = structuredClone(stored);
      const localRounds = structuredClone(rounds.get(hash)!);
      const localResets = structuredClone(resets.get(hash)!);
      const result = await work({
        session,
        now: now(),
        findRound: async (id) => localRounds.get(id) ?? null,
        findReset: async (id) => localResets.get(id) ?? null,
        history: async () =>
          [...localRounds.values()]
            .filter((r) => r.generation === session.generation)
            .sort((a, b) => b.sequence - a.sequence)
            .slice(0, 5),
        saveRound: async (round) => {
          localRounds.set(round.id, structuredClone(round));
        },
        saveReset: async (reset) => {
          localResets.set(reset.requestId, structuredClone(reset));
        },
        saveSession: async () => undefined,
      });
      sessions.set(hash, session);
      rounds.set(hash, localRounds);
      resets.set(hash, localResets);
      return structuredClone(result);
    },
  };
  return { repository, sessions };
}
