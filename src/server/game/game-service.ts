import type {
  GameSession,
  ResetInput,
  Round,
  RoundInput,
  WinningLine,
} from "@/features/game/contracts";
import { GameError } from "./errors";
import type { GameRepository, SessionTransaction } from "./game-repository";
import {
  initialBalance,
  maxSessionOperations,
  sessionLifetimeMs,
  settleRound,
  validateBet,
} from "./rules";

interface Dependencies {
  repository: GameRepository;
  draw: () => WinningLine;
  newId: () => string;
}

async function snapshot(transaction: SessionTransaction): Promise<GameSession> {
  const { generation, version, balance, roundCount, expiresAt } =
    transaction.session;
  return {
    generation,
    version,
    balance,
    roundCount,
    expiresAt,
    history: await transaction.history(),
  };
}

function ensureCapacity(transaction: SessionTransaction) {
  if (transaction.session.operationCount >= maxSessionOperations) {
    throw new GameError("SESSION_LIMIT");
  }
}

export function createGameService({ repository, draw, newId }: Dependencies) {
  function activeSession<T>(
    tokenHash: string,
    work: (transaction: SessionTransaction) => Promise<T>,
  ) {
    return repository.withSession(tokenHash, async (transaction) => {
      if (
        new Date(transaction.session.expiresAt).getTime() <=
        transaction.now.getTime()
      ) {
        throw new GameError("SESSION_EXPIRED");
      }
      return work(transaction);
    });
  }

  return {
    async createSession(tokenHash: string): Promise<GameSession> {
      const session = await repository.createSession(
        {
          tokenHash,
          generation: newId(),
          version: 0,
          balance: initialBalance,
          roundCount: 0,
          operationCount: 0,
        },
        sessionLifetimeMs,
      );
      return {
        generation: session.generation,
        version: 0,
        balance: initialBalance,
        roundCount: 0,
        expiresAt: session.expiresAt,
        history: [],
      };
    },

    getSession(tokenHash: string) {
      return activeSession(tokenHash, snapshot);
    },

    play(tokenHash: string, input: RoundInput): Promise<Round> {
      validateBet(input.bet);
      return activeSession(tokenHash, async (transaction) => {
        const existing = await transaction.findRound(input.requestId);
        if (existing) {
          if (
            existing.bet !== input.bet ||
            existing.generation !== input.generation
          ) {
            throw new GameError("IDEMPOTENCY_CONFLICT");
          }
          return existing;
        }
        if (await transaction.findReset(input.requestId)) {
          throw new GameError("IDEMPOTENCY_CONFLICT");
        }
        const session = transaction.session;
        if (session.generation !== input.generation) {
          throw new GameError("SESSION_CHANGED");
        }
        ensureCapacity(transaction);
        // Validate funds before drawing; unsuccessful attempts consume no result.
        if (session.balance < input.bet)
          throw new GameError("INSUFFICIENT_BALANCE");
        const line = draw();
        const result = settleRound(session.balance, input.bet, line);
        session.balance = result.balance;
        session.version += 1;
        session.roundCount += 1;
        session.operationCount += 1;
        const round: Round = {
          id: input.requestId,
          generation: session.generation,
          version: session.version,
          sequence: session.roundCount,
          bet: input.bet,
          symbols: line,
          prize: result.prize,
          balance: result.balance,
          createdAt: transaction.now.toISOString(),
        };
        await transaction.saveRound(round);
        await transaction.saveSession();
        return round;
      });
    },

    getRound(tokenHash: string, id: string) {
      return activeSession(tokenHash, async (transaction) => {
        const round = await transaction.findRound(id);
        if (!round) throw new GameError("ROUND_NOT_FOUND");
        return round;
      });
    },

    getHistory(tokenHash: string) {
      return activeSession(tokenHash, (transaction) => transaction.history());
    },

    reset(tokenHash: string, input: ResetInput): Promise<GameSession> {
      return activeSession(tokenHash, async (transaction) => {
        const previous = await transaction.findReset(input.requestId);
        if (previous) {
          if (
            previous.generation !== input.generation ||
            previous.version !== input.version
          ) {
            throw new GameError("IDEMPOTENCY_CONFLICT");
          }
          return previous.snapshot;
        }
        if (await transaction.findRound(input.requestId)) {
          throw new GameError("IDEMPOTENCY_CONFLICT");
        }
        const session = transaction.session;
        if (
          session.generation !== input.generation ||
          session.version !== input.version
        ) {
          throw new GameError("SESSION_CHANGED");
        }
        ensureCapacity(transaction);
        session.generation = newId();
        session.version += 1;
        session.balance = initialBalance;
        session.roundCount = 0;
        session.operationCount += 1;
        await transaction.saveSession();
        const result = await snapshot(transaction);
        await transaction.saveReset({ ...input, snapshot: result });
        return result;
      });
    },
  };
}
