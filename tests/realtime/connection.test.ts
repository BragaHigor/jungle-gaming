import { once } from "node:events";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createRealtimeClient } from "@/features/game/api/realtime";
import { createRealtimeServer } from "@/server/realtime/create-server";

let infrastructure: ReturnType<typeof createRealtimeServer>;
let clients: ReturnType<typeof createRealtimeClient>[];

beforeEach(async () => {
  clients = [];
  infrastructure = createRealtimeServer(["http://localhost:3000"]);
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

describe("restrições da conexão em tempo real", () => {
  it("conecta o cliente do projeto com uma origem permitida e recebe uma confirmação", async () => {
    const client = createClient("http://localhost:3000");
    const connected = new Promise<void>((resolve, reject) => {
      client.once("connect", resolve);
      client.once("connect_error", reject);
    });
    client.connect();
    await connected;

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
