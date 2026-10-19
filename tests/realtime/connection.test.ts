import { once } from "node:events";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createRealtimeClient } from "@/features/game/api/realtime";
import { createRealtimeServer } from "@/server/realtime/create-server";
import { subscribeToGameEvents } from "@/features/game/api/game-events";
import { round } from "../game/client-fixtures";

let infrastructure: ReturnType<typeof createRealtimeServer>;
let clients: ReturnType<typeof createRealtimeClient>[];

beforeEach(async () => {
  clients = [];
  infrastructure = createRealtimeServer(["http://localhost:3000"], {
    authorize: async () => ({
      sessionHash: "test-session",
      lifetimeMs: 60_000,
    }),
    listen: async () => {},
  });
  infrastructure.server.listen(0, "127.0.0.1");
  await once(infrastructure.server, "listening");
  const address = infrastructure.server.address();
  if (!address || typeof address === "string")
    throw new Error("Missing test server port");
  vi.stubEnv("NEXT_PUBLIC_REALTIME_URL", `http://127.0.0.1:${address.port}`);
  vi.stubEnv("NEXT_PUBLIC_REALTIME_PATH", "/api/realtime/socket.io");
});

afterEach(async () => {
  for (const client of clients) client.disconnect();
  await new Promise<void>((resolve) =>
    infrastructure.io.close(() => resolve()),
  );
});

function createClient(origin?: string) {
  const client = createRealtimeClient();
  client.io.opts.extraHeaders = origin ? { Origin: origin } : {};
  clients.push(client);
  return client;
}

describe("saúde HTTP do serviço de eventos", () => {
  it.each(["/health", "/api/realtime/health"])(
    "responde no caminho %s sem criar uma conexão Socket.IO",
    async (path) => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_REALTIME_URL}${path}`,
      );
      expect(response.status).toBe(200);
      expect(response.headers.get("cache-control")).toBe("no-store");
      expect(await response.json()).toEqual({ status: "ok" });
      expect(infrastructure.io.sockets.sockets.size).toBe(0);
    },
  );

  it("não apresenta rotas desconhecidas como serviço saudável", async () => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_REALTIME_URL}/api/realtime/unknown`,
    );
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ status: "not_found" });
  });
});

describe("restrições da conexão em tempo real", () => {
  it("valida eventos, sincroniza ao conectar e remove listeners ao sair", async () => {
    const client = createClient("http://localhost:3000");
    const synchronize = vi.fn();
    const status = vi.fn();
    const events = subscribeToGameEvents({ synchronize, status }, client);
    await expect.poll(() => client.connected).toBe(true);
    expect(synchronize).toHaveBeenCalledWith();
    infrastructure.io.emit("round:completed", { ...round, balance: -1 });
    infrastructure.io.emit("round:completed", round);
    infrastructure.io.emit("session:reset", {
      id: round.id,
      generation: round.generation,
      version: 2,
    });
    await expect.poll(() => synchronize.mock.calls.length).toBe(3);
    expect(synchronize.mock.calls).toEqual([[], [1], [2]]);
    expect(status).toHaveBeenLastCalledWith("connected");
    events.close();
    expect(client.listeners("round:completed")).toHaveLength(0);
    expect(client.listeners("session:reset")).toHaveLength(0);
    expect(client.io.listeners("reconnect_attempt")).toHaveLength(0);
    await expect.poll(() => infrastructure.io.sockets.sockets.size).toBe(0);
  });

  it("reconecta com leitura de sincronização e mantém só uma assinatura ativa", async () => {
    const client = createClient("http://localhost:3000");
    const synchronize = vi.fn();
    const status = vi.fn();
    const events = subscribeToGameEvents({ synchronize, status }, client);
    await expect.poll(() => client.connected).toBe(true);
    // A transport loss allows the Manager to reconnect automatically.
    for (const socket of infrastructure.io.sockets.sockets.values())
      socket.conn.close();
    await expect
      .poll(() => synchronize.mock.calls.length, { timeout: 4000 })
      .toBe(2);
    expect(client.listeners("round:completed")).toHaveLength(1);
    expect(infrastructure.io.sockets.sockets.size).toBe(1);
    expect(status).toHaveBeenCalledWith("reconnecting");
    events.close();
  });

  it("conecta sem barra final no handshake e recebe uma confirmação", async () => {
    let handshakePath: string | undefined;
    infrastructure.server.prependOnceListener("upgrade", (request) => {
      handshakePath = new URL(request.url!, "http://localhost").pathname;
    });
    const client = createClient("http://localhost:3000");
    const connected = new Promise<void>((resolve, reject) => {
      client.once("connect", resolve);
      client.once("connect_error", reject);
    });
    client.connect();
    await connected;
    expect(handshakePath).toBe("/api/realtime/socket.io");

    await expect(
      client.timeout(3000).emitWithAck("infrastructure:ping"),
    ).resolves.toEqual({ status: "ok" });
  });

  it.each(["https://untrusted.example", undefined])(
    "recusa uma origem não permitida ou ausente %j",
    async (origin) => {
      const client = createClient(origin);
      const rejected = new Promise<Error>((resolve, reject) => {
        client.once("connect_error", resolve);
        client.once("connect", () =>
          reject(new Error("Unexpected accepted origin")),
        );
      });
      client.connect();
      await rejected;
      expect(client.connected).toBe(false);
    },
  );
});
