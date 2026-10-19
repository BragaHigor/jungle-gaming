import { createHash, randomBytes, randomUUID } from "node:crypto";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { Pool } from "pg";
import { io, type Socket } from "socket.io-client";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import { createGameService } from "@/server/game/game-service";
import { createPostgresRepository } from "@/server/game/storage";
import { createRealtimeDatabase } from "@/server/realtime/database";
import { createRealtimeServer } from "@/server/realtime/create-server";
import {
  realtimePath,
  type RealtimeClientEvents,
  type RealtimeServerEvents,
} from "@/lib/realtime-contracts";
import type { Round } from "@/features/game/contracts";

const connectionString = process.env.TEST_DATABASE_URL;
if (!connectionString)
  throw new Error("Configure TEST_DATABASE_URL para os testes de eventos.");
const schema = `realtime_test_${randomUUID().replaceAll("-", "")}`;
const control = new Pool({ connectionString, max: 1 });
const scoped = new URL(connectionString);
scoped.searchParams.set("options", `-c search_path=${schema}`);
const pool = new Pool({ connectionString: scoped.toString(), max: 3 });
const repository = createPostgresRepository(pool);
const service = createGameService({
  repository,
  draw: () => ["leaf", "flower", "gem"],
  newId: randomUUID,
});
const origin = "http://localhost:3000";
type TestClient = Socket<RealtimeServerEvents, RealtimeClientEvents>;
let instances: {
  database: ReturnType<typeof createRealtimeDatabase>;
  server: ReturnType<typeof createRealtimeServer>;
  url: string;
}[];
let clients: TestClient[];

beforeAll(async () => {
  await control.query(`CREATE SCHEMA ${schema}`);
  await pool.query(
    await readFile(
      new URL("../../database/001-game.sql", import.meta.url),
      "utf8",
    ),
  );
});
beforeEach(async () => {
  clients = [];
  instances = [];
  for (let index = 0; index < 2; index++) {
    const direct = new URL(scoped);
    direct.searchParams.set("application_name", `${schema}_${index}`);
    const database = createRealtimeDatabase(
      scoped.toString(),
      direct.toString(),
    );
    const server = createRealtimeServer([origin], database);
    server.server.listen(0, "127.0.0.1");
    await once(server.server, "listening");
    const address = server.server.address();
    if (!address || typeof address === "string")
      throw new Error("PORT_REQUIRED");
    instances.push({
      database,
      server,
      url: `http://127.0.0.1:${address.port}`,
    });
  }
});
afterEach(async () => {
  clients.forEach((client) => client.disconnect());
  for (const instance of instances) {
    await new Promise<void>((resolve) =>
      instance.server.io.close(() => resolve()),
    );
    await instance.database.close();
  }
});
afterAll(async () => {
  await pool.end();
  try {
    await control.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
  } finally {
    await control.end();
  }
});

async function session() {
  const token = randomBytes(32).toString("hex");
  const hash = createHash("sha256").update(token).digest("hex");
  return { token, hash, snapshot: await service.createSession(hash) };
}
function clientFor(index: number, token?: string) {
  const client: TestClient = io(instances[index].url, {
    path: realtimePath,
    transports: ["websocket"],
    autoConnect: false,
    reconnection: false,
    extraHeaders: {
      Origin: origin,
      ...(token ? { Cookie: `canopy-session=${token}` } : {}),
    },
  });
  clients.push(client);
  return client;
}
async function connect(client: TestClient) {
  const ready = new Promise<void>((resolve, reject) => {
    client.once("connect", resolve);
    client.once("connect_error", reject);
  });
  client.connect();
  await ready;
}
function nextRound(client: TestClient) {
  return new Promise<Round>((resolve) =>
    client.once("round:completed", resolve),
  );
}

describe("eventos confirmados entre instâncias e sessões PostgreSQL", () => {
  it("derruba o socket quando perde LISTEN e refaz a assinatura ao reconectar", async () => {
    const own = await session();
    const client = clientFor(0, own.token);
    await connect(client);
    const disconnected = new Promise((resolve) =>
      client.once("disconnect", resolve),
    );
    const result = await control.query(
      "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE application_name=$1 AND datname=current_database()",
      [`${schema}_0`],
    );
    expect(result.rowCount).toBe(1);
    await disconnected;
    expect(client.connected).toBe(false);
    await connect(client);
    await expect(
      client.timeout(3000).emitWithAck("infrastructure:ping"),
    ).resolves.toEqual({ status: "ok" });
  });

  it("entrega a mesma rodada a duas instâncias e não revela dados de outra sessão", async () => {
    const own = await session();
    const other = await session();
    const first = clientFor(0, own.token);
    const second = clientFor(1, own.token);
    const outsider = clientFor(1, other.token);
    const leaked: Round[] = [];
    outsider.on("round:completed", (round) => leaked.push(round));
    await Promise.all([connect(first), connect(second), connect(outsider)]);
    const deliveries = Promise.all([nextRound(first), nextRound(second)]);
    const result = await service.play(own.hash, {
      requestId: randomUUID(),
      generation: own.snapshot.generation,
      bet: 25,
    });
    expect(await deliveries).toEqual([result, result]);
    expect(leaked).toEqual([]);
    expect((await service.getSession(own.hash)).balance).toBe(result.balance);
  });

  it.each(["ausente", "desconhecida", "expirada"])(
    "recusa sessão %s no handshake",
    async (kind) => {
      const own = await session();
      if (kind === "expirada")
        await pool.query(
          "UPDATE game_sessions SET expires_at=clock_timestamp()-interval '1 second' WHERE token_hash=$1",
          [own.hash],
        );
      const client = clientFor(
        0,
        kind === "ausente"
          ? undefined
          : kind === "desconhecida"
            ? "a".repeat(64)
            : own.token,
      );
      const denied = new Promise<Error>((resolve) =>
        client.once("connect_error", resolve),
      );
      client.connect();
      expect((await denied).message).toBe("REALTIME_UNAVAILABLE");
      expect(client.connected).toBe(false);
    },
  );

  it("não publica rollback nem repetições idempotentes e confirma o reinício", async () => {
    const own = await session();
    const client = clientFor(0, own.token);
    const delivered: Round[] = [];
    client.on("round:completed", (round) => delivered.push(round));
    await connect(client);
    const broken = createGameService({
      repository: {
        ...repository,
        withSession: (hash, work) =>
          repository.withSession(hash, async (transaction) => {
            await work(transaction);
            throw new Error("ROLLBACK_TEST");
          }),
      },
      draw: () => ["gem", "gem", "gem"],
      newId: randomUUID,
    });
    const input = {
      requestId: randomUUID(),
      generation: own.snapshot.generation,
      bet: 25 as const,
    };
    await expect(broken.play(own.hash, input)).rejects.toThrow("ROLLBACK_TEST");
    const firstDelivery = nextRound(client);
    const first = await service.play(own.hash, input);
    expect(await firstDelivery).toEqual(first);
    await service.play(own.hash, input);
    const secondDelivery = nextRound(client);
    const second = await service.play(own.hash, {
      ...input,
      requestId: randomUUID(),
    });
    expect(await secondDelivery).toEqual(second);
    expect(delivered).toEqual([first, second]);
    const resetDelivery = new Promise((resolve) =>
      client.once("session:reset", resolve),
    );
    const requestId = randomUUID();
    const reset = await service.reset(own.hash, {
      requestId,
      generation: second.generation,
      version: second.version,
    });
    expect(await resetDelivery).toEqual({
      id: requestId,
      generation: reset.generation,
      version: reset.version,
    });
  });

  it("recupera dados persistidos após desconectar e reconectar em outra instância", async () => {
    const own = await session();
    const first = clientFor(0, own.token);
    await connect(first);
    first.disconnect();
    const result = await service.play(own.hash, {
      requestId: randomUUID(),
      generation: own.snapshot.generation,
      bet: 50,
    });
    const second = clientFor(1, own.token);
    await connect(second);
    const recovered = await service.getSession(own.hash);
    expect(recovered.history).toEqual([result]);
    expect(recovered.balance).toBe(result.balance);
    expect(recovered.version).toBe(1);
  });
});
