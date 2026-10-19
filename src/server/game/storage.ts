import type { Pool, PoolClient } from "pg";
import type { Round } from "@/features/game/contracts";
import { GameError } from "./errors";
import type {
  GameRepository,
  ResetRecord,
  SessionRecord,
  SessionTransaction,
} from "./game-repository";

type SessionRow = {
  token_hash: string;
  generation: string;
  version: number;
  balance: number;
  round_count: number;
  operation_count: number;
  expires_at: Date;
};
type RoundRow = Omit<Round, "createdAt"> & { created_at: Date };

function roundFromRow(row: RoundRow): Round {
  const { created_at, ...round } = row;
  return { ...round, createdAt: created_at.toISOString() };
}

function transactionFor(
  client: PoolClient,
  session: SessionRecord,
  now: Date,
): SessionTransaction {
  return {
    session,
    now,
    async findRound(id) {
      const { rows } = await client.query<RoundRow>(
        "SELECT id, generation, version, sequence, bet, symbols, prize, balance, created_at FROM game_rounds WHERE session_hash = $1 AND id = $2",
        [session.tokenHash, id],
      );
      return rows[0] ? roundFromRow(rows[0]) : null;
    },
    async findReset(id) {
      const { rows } = await client.query<ResetRecord>(
        'SELECT id AS "requestId", generation, version, snapshot FROM game_resets WHERE session_hash = $1 AND id = $2',
        [session.tokenHash, id],
      );
      return rows[0] ?? null;
    },
    async history() {
      const { rows } = await client.query<RoundRow>(
        "SELECT id, generation, version, sequence, bet, symbols, prize, balance, created_at FROM game_rounds WHERE session_hash = $1 AND generation = $2 ORDER BY sequence DESC LIMIT 5",
        [session.tokenHash, session.generation],
      );
      return rows.map(roundFromRow);
    },
    async saveRound(round) {
      await client.query(
        "INSERT INTO game_rounds (session_hash, id, generation, version, sequence, bet, symbols, prize, balance, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",
        [
          session.tokenHash,
          round.id,
          round.generation,
          round.version,
          round.sequence,
          round.bet,
          round.symbols,
          round.prize,
          round.balance,
          round.createdAt,
        ],
      );
    },
    async saveReset(reset) {
      await client.query(
        "INSERT INTO game_resets (session_hash, id, generation, version, snapshot) VALUES ($1,$2,$3,$4,$5)",
        [
          session.tokenHash,
          reset.requestId,
          reset.generation,
          reset.version,
          JSON.stringify(reset.snapshot),
        ],
      );
    },
    async saveSession() {
      await client.query(
        "UPDATE game_sessions SET generation=$2, version=$3, balance=$4, round_count=$5, operation_count=$6 WHERE token_hash=$1",
        [
          session.tokenHash,
          session.generation,
          session.version,
          session.balance,
          session.roundCount,
          session.operationCount,
        ],
      );
    },
  };
}

async function inTransaction<T>(
  pool: Pool,
  work: (client: PoolClient) => Promise<T>,
) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // Transaction-local settings also work through Neon's transaction pooler.
    await client.query(
      "SET LOCAL statement_timeout = '5s'; SET LOCAL lock_timeout = '5s'; SET LOCAL idle_in_transaction_session_timeout = '10s'",
    );
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

export function createPostgresRepository(pool: Pool): GameRepository {
  return {
    async createSession(session, lifetimeMs) {
      return inTransaction(pool, async (client) => {
        // Bounded cleanup on creation; expiry checks do not depend on this cleanup.
        await client.query(
          "DELETE FROM game_sessions WHERE token_hash IN (SELECT token_hash FROM game_sessions WHERE expires_at < now() ORDER BY expires_at LIMIT 20)",
        );
        const { rows } = await client.query<{ expires_at: Date }>(
          "INSERT INTO game_sessions (token_hash, generation, version, balance, round_count, operation_count, expires_at) VALUES ($1,$2,$3,$4,$5,$6,clock_timestamp() + $7 * interval '1 millisecond') RETURNING expires_at",
          [
            session.tokenHash,
            session.generation,
            session.version,
            session.balance,
            session.roundCount,
            session.operationCount,
            lifetimeMs,
          ],
        );
        return { ...session, expiresAt: rows[0].expires_at.toISOString() };
      });
    },
    async withSession(tokenHash, work) {
      return inTransaction(pool, async (client) => {
        const { rows } = await client.query<SessionRow>(
          "SELECT * FROM game_sessions WHERE token_hash = $1 FOR UPDATE",
          [tokenHash],
        );
        const row = rows[0];
        if (!row) throw new GameError("SESSION_REQUIRED");
        const session: SessionRecord = {
          tokenHash: row.token_hash,
          generation: row.generation,
          version: row.version,
          balance: row.balance,
          roundCount: row.round_count,
          operationCount: row.operation_count,
          expiresAt: row.expires_at.toISOString(),
        };
        // Read the database clock after acquiring the lock, so waiting cannot
        // validate an already-expired session using an earlier timestamp.
        const { rows: clock } = await client.query<{ now: Date }>(
          "SELECT clock_timestamp() AS now",
        );
        return work(transactionFor(client, session, clock[0].now));
      });
    },
  };
}
