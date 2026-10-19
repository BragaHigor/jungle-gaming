import { createHash, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { Pool } from "pg";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import type { WinningLine } from "@/features/game/contracts";
import { createGameService } from "@/server/game/game-service";
import { createPostgresRepository } from "@/server/game/storage";
import type { GameRepository } from "@/server/game/game-repository";

const connectionString = process.env.TEST_DATABASE_URL;
if (!connectionString)
  throw new Error(
    "Configure TEST_DATABASE_URL com PostgreSQL de testes, nunca produção.",
  );
const schema = `game_test_${randomUUID().replaceAll("-", "")}`;
const control = new Pool({
  connectionString,
  max: 1,
  connectionTimeoutMillis: 5_000,
});
const options = {
  connectionString,
  max: 4,
  options: `-c search_path=${schema}`,
  connectionTimeoutMillis: 5_000,
};
const firstPool = new Pool(options);
const secondPool = new Pool(options);
const firstRepository = createPostgresRepository(firstPool);
const secondRepository = createPostgresRepository(secondPool);
const tokenHash = () => createHash("sha256").update(randomUUID()).digest("hex");
const draw = vi.fn<() => WinningLine>(() => ["leaf", "flower", "gem"]);
const serviceFor = (repository: GameRepository) =>
  createGameService({
    repository,
    draw,
    newId: randomUUID,
  });
const first = serviceFor(firstRepository);
const second = serviceFor(secondRepository);

beforeAll(async () => {
  await control.query(`CREATE SCHEMA ${schema}`);
  await firstPool.query(
    await readFile(
      new URL("../../database/001-game.sql", import.meta.url),
      "utf8",
    ),
  );
});
beforeEach(async () => {
  await firstPool.query("TRUNCATE game_sessions CASCADE");
  draw.mockClear();
});
afterAll(async () => {
  await Promise.all([firstPool.end(), secondPool.end()]);
  try {
    await control.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
  } finally {
    await control.end();
  }
});

describe("persistência PostgreSQL real entre conexões independentes", () => {
  it("usa o relógio do banco para expiração e data da rodada", async () => {
    const hash = tokenHash();
    const session = await first.createSession(hash);
    await first.play(hash, {
      requestId: randomUUID(),
      generation: session.generation,
      bet: 10,
    });
    const {
      rows: [times],
    } = await firstPool.query(
      "SELECT abs(extract(epoch from (s.expires_at - clock_timestamp())) - 86400) < 10 AS correct_expiry, abs(extract(epoch from (r.created_at - clock_timestamp()))) < 10 AS correct_round_time FROM game_sessions s JOIN game_rounds r ON r.session_hash=s.token_hash WHERE s.token_hash=$1",
      [hash],
    );
    expect(times).toEqual({ correct_expiry: true, correct_round_time: true });
  });
  it("serializa solicitações duplicadas sem novo sorteio ou débito", async () => {
    const hash = tokenHash();
    const session = await first.createSession(hash);
    const input = {
      requestId: randomUUID(),
      generation: session.generation,
      bet: 50 as const,
    };
    const results = await Promise.all(
      Array.from({ length: 30 }, (_, i) =>
        (i % 2 ? first : second).play(hash, input),
      ),
    );
    expect(
      results.every((r) => JSON.stringify(r) === JSON.stringify(results[0])),
    ).toBe(true);
    expect(draw).toHaveBeenCalledTimes(1);
    expect(await second.getSession(hash)).toMatchObject({
      balance: 950,
      version: 1,
      roundCount: 1,
    });
    expect(
      (await firstPool.query("SELECT count(*)::int AS total FROM game_rounds"))
        .rows[0].total,
    ).toBe(1);
  });

  it("não permite saldo negativo com intenções distintas concorrentes", async () => {
    const hash = tokenHash();
    const session = await first.createSession(hash);
    const outcomes = await Promise.allSettled(
      Array.from({ length: 30 }, (_, i) =>
        (i % 2 ? first : second).play(hash, {
          requestId: randomUUID(),
          generation: session.generation,
          bet: 50,
        }),
      ),
    );
    expect(outcomes.filter((r) => r.status === "fulfilled")).toHaveLength(20);
    const failures = outcomes.filter((r) => r.status === "rejected");
    expect(failures).toHaveLength(10);
    expect(
      failures.every((r) => r.reason.code === "INSUFFICIENT_BALANCE"),
    ).toBe(true);
    expect(await second.getSession(hash)).toMatchObject({
      balance: 0,
      version: 20,
      roundCount: 20,
    });
    expect((await first.getHistory(hash)).map((r) => r.sequence)).toEqual([
      20, 19, 18, 17, 16,
    ]);
  });

  it("reverte saldo e rodada juntos quando falha após a escrita", async () => {
    const hash = tokenHash();
    const session = await first.createSession(hash);
    const input = {
      requestId: randomUUID(),
      generation: session.generation,
      bet: 25 as const,
    };
    const failing: GameRepository = {
      ...firstRepository,
      withSession: (hash, work) =>
        firstRepository.withSession(hash, (tx) =>
          work({
            ...tx,
            async saveSession() {
              await tx.saveSession();
              throw new Error("FALHA_CONTROLADA_APOS_ESCRITA");
            },
          }),
        ),
    };
    await expect(serviceFor(failing).play(hash, input)).rejects.toThrow(
      "FALHA_CONTROLADA_APOS_ESCRITA",
    );
    expect(await second.getSession(hash)).toMatchObject({
      balance: 1000,
      version: 0,
      history: [],
    });
    await expect(second.getRound(hash, input.requestId)).rejects.toThrow(
      "ROUND_NOT_FOUND",
    );
    await second.play(hash, input);
    expect((await first.getSession(hash)).balance).toBe(975);
  });

  it("impede acesso a rodada de outra sessão e conflitos de intenção", async () => {
    const a = tokenHash();
    const b = tokenHash();
    const session = await first.createSession(a);
    await second.createSession(b);
    const input = {
      requestId: randomUUID(),
      generation: session.generation,
      bet: 10 as const,
    };
    await first.play(a, input);
    await expect(second.getRound(b, input.requestId)).rejects.toThrow(
      "ROUND_NOT_FOUND",
    );
    await expect(second.play(a, { ...input, bet: 25 })).rejects.toThrow(
      "IDEMPOTENCY_CONFLICT",
    );
    expect((await second.getSession(b)).balance).toBe(1000);
  });

  it("persiste reinício idempotente e recupera rodada antiga sem novo débito", async () => {
    const hash = tokenHash();
    const session = await first.createSession(hash);
    const input = {
      requestId: randomUUID(),
      generation: session.generation,
      bet: 25 as const,
    };
    const round = await first.play(hash, input);
    const reset = {
      requestId: randomUUID(),
      generation: session.generation,
      version: 1,
    };
    const results = await Promise.all([
      first.reset(hash, reset),
      second.reset(hash, reset),
    ]);
    expect(results[0]).toEqual(results[1]);
    expect(results[0]).toMatchObject({
      balance: 1000,
      version: 2,
      roundCount: 0,
      history: [],
    });
    expect(await second.play(hash, input)).toEqual(round);
    await expect(
      first.play(hash, { ...input, requestId: randomUUID() }),
    ).rejects.toThrow("SESSION_CHANGED");
    expect((await second.getSession(hash)).balance).toBe(1000);
  });

  it("resolve disputa entre giro e reinício por geração e versão sob o mesmo bloqueio", async () => {
    const hash = tokenHash();
    const session = await first.createSession(hash);
    const outcomes = await Promise.allSettled([
      first.play(hash, {
        requestId: randomUUID(),
        generation: session.generation,
        bet: 25,
      }),
      second.reset(hash, {
        requestId: randomUUID(),
        generation: session.generation,
        version: 0,
      }),
    ]);
    expect(outcomes.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(
      outcomes
        .filter((r) => r.status === "rejected")
        .every((r) => r.reason.code === "SESSION_CHANGED"),
    ).toBe(true);
    expect((await second.getSession(hash)).version).toBe(1);
  });

  it("recupera estado em pool novo e rejeita sessão expirada", async () => {
    const hash = tokenHash();
    const session = await first.createSession(hash);
    await first.play(hash, {
      requestId: randomUUID(),
      generation: session.generation,
      bet: 10,
    });
    const freshPool = new Pool(options);
    try {
      expect(
        await serviceFor(createPostgresRepository(freshPool)).getSession(hash),
      ).toMatchObject({ balance: 990, version: 1, roundCount: 1 });
    } finally {
      await freshPool.end();
    }
    await firstPool.query(
      "UPDATE game_sessions SET expires_at=now()-interval '1 second' WHERE token_hash=$1",
      [hash],
    );
    await expect(second.getSession(hash)).rejects.toThrow("SESSION_EXPIRED");
  });
});
