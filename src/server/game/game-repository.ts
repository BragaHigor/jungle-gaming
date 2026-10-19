import type { GameSession, ResetInput, Round } from "@/features/game/contracts";

export interface SessionRecord {
  tokenHash: string;
  generation: string;
  version: number;
  balance: number;
  roundCount: number;
  operationCount: number;
  expiresAt: string;
}

export interface ResetRecord extends ResetInput {
  snapshot: GameSession;
}

// Every operation below uses the same database transaction and session row lock.
export interface SessionTransaction {
  session: SessionRecord;
  now: Date;
  findRound(id: string): Promise<Round | null>;
  findReset(id: string): Promise<ResetRecord | null>;
  history(): Promise<Round[]>;
  saveRound(round: Round): Promise<void>;
  saveReset(reset: ResetRecord): Promise<void>;
  saveSession(): Promise<void>;
}

export interface GameRepository {
  createSession(
    session: Omit<SessionRecord, "expiresAt">,
    lifetimeMs: number,
  ): Promise<SessionRecord>;
  withSession<T>(
    tokenHash: string,
    work: (transaction: SessionTransaction) => Promise<T>,
  ): Promise<T>;
}
