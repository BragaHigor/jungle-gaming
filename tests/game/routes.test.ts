import { createHash, randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  POST as createSession,
  GET as getSession,
} from "@/app/api/game/session/route";
import { POST as play, GET as history } from "@/app/api/game/rounds/route";
import { GET as getRound } from "@/app/api/game/rounds/[id]/route";
import { POST as reset } from "@/app/api/game/session/reset/route";
import { createGameService } from "@/server/game/game-service";
import { getGameService } from "@/server/game/runtime";
import { memoryRepository } from "./memory-repository";

vi.mock("@/server/game/runtime", async () => {
  const { createHash, randomBytes } = await import("node:crypto");
  return {
    getGameService: vi.fn(),
    hashSessionToken: (value: string) =>
      createHash("sha256").update(value).digest("hex"),
    newSessionToken: () => randomBytes(32).toString("hex"),
  };
});

const origin = "http://localhost:3000";
let service: ReturnType<typeof createGameService>;
let clock: Date;

beforeEach(() => {
  vi.mocked(getGameService).mockReset();
  clock = new Date("2026-10-18T12:00:00.000Z");
  service = createGameService({
    repository: memoryRepository(() => clock).repository,
    draw: () => ["flower", "flower", "flower"],
    newId: randomUUID,
  });
  vi.mocked(getGameService).mockReturnValue(service);
});

function request(
  path: string,
  body?: unknown,
  token?: string,
  headers?: Record<string, string>,
) {
  return new NextRequest(`${origin}/api/game/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      origin,
      "content-type": "application/json",
      ...(token ? { cookie: `canopy-session=${token}` } : {}),
      ...headers,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

async function session() {
  const response = await createSession(request("session", {}));
  return {
    token: response.cookies.get("canopy-session")!.value,
    data: await response.json(),
  };
}

describe("contrato HTTP e proteção da sessão", () => {
  it("cria cookie HTTP-only e retorna somente dados públicos sem cache", async () => {
    const response = await createSession(request("session", {}));
    expect(response.status).toBe(201);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.cookies.get("canopy-session")).toMatchObject({
      httpOnly: true,
      sameSite: "strict",
      path: "/api/game",
    });
    const body = await response.json();
    expect(body.balance).toBe(1000);
    expect(body).not.toHaveProperty("tokenHash");
    expect(body).not.toHaveProperty("token");
    expect(response.cookies.get("canopy-session")!.value).toMatch(
      /^[a-f0-9]{64}$/,
    );
  });

  it("reutiliza sessão ativa ao repetir criação sem reiniciar o saldo", async () => {
    const { token, data } = await session();
    await play(
      request(
        "rounds",
        { requestId: randomUUID(), generation: data.generation, bet: 10 },
        token,
      ),
    );
    const response = await createSession(request("session", {}, token));
    expect(response.status).toBe(200);
    expect((await response.json()).balance).toBe(1040);
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("exige cookie válido em consulta e aposta", async () => {
    const response = await getSession(request("session"));
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: { code: "SESSION_REQUIRED" },
    });
    expect((await play(request("rounds", {}, "invalido"))).status).toBe(401);
  });

  it("bloqueia origem externa ou ausente e formato não JSON antes do serviço", async () => {
    const invalidHeaders: Record<string, string>[] = [
      { origin: "https://outro.example" },
      { origin: "" },
      { "content-type": "text/plain" },
    ];
    for (const headers of invalidHeaders) {
      const response = await createSession(
        request("session", {}, undefined, headers),
      );
      expect([403, 415]).toContain(response.status);
    }
    expect(getGameService).not.toHaveBeenCalled();
  });

  it("rejeita corpo excessivo, JSON inválido e tentativa de definir saldo", async () => {
    const { token } = await session();
    const large = request("rounds", { text: "x".repeat(4096) }, token);
    expect((await play(large)).status).toBe(413);
    const malformed = new NextRequest(`${origin}/api/game/rounds`, {
      method: "POST",
      headers: {
        origin,
        "content-type": "application/json",
        cookie: `canopy-session=${token}`,
      },
      body: "{",
    });
    expect((await play(malformed)).status).toBe(400);
    expect(
      (await createSession(request("session", { balance: 99999 }))).status,
    ).toBe(400);
  });

  it("valida aposta e identificadores em runtime e recupera rodada pela própria sessão", async () => {
    const { token, data } = await session();
    const input = {
      requestId: randomUUID(),
      generation: data.generation,
      bet: 25,
    };
    expect(
      (await play(request("rounds", { ...input, bet: "25" }, token))).status,
    ).toBe(400);
    expect(
      (await play(request("rounds", { ...input, requestId: "abc" }, token)))
        .status,
    ).toBe(400);
    expect(
      (await play(request("rounds", { ...input, balance: 99999 }, token)))
        .status,
    ).toBe(400);
    const result = await play(request("rounds", input, token));
    expect(result.status).toBe(200);
    const round = await result.json();
    const lookup = await getRound(
      request(`rounds/${input.requestId}`, undefined, token),
      { params: Promise.resolve({ id: input.requestId }) },
    );
    expect(await lookup.json()).toEqual(round);
    const other = await session();
    expect(
      (
        await getRound(
          request(`rounds/${input.requestId}`, undefined, other.token),
          { params: Promise.resolve({ id: input.requestId }) },
        )
      ).status,
    ).toBe(404);
    expect(
      (await (await history(request("rounds", undefined, token))).json())
        .rounds,
    ).toHaveLength(1);
  });

  it("exige versão e geração no reinício e não repete o reinício", async () => {
    const { token, data } = await session();
    const input = {
      requestId: randomUUID(),
      generation: data.generation,
      version: 0,
    };
    expect(
      (await reset(request("session/reset", { ...input, version: -1 }, token)))
        .status,
    ).toBe(400);
    const first = await reset(request("session/reset", input, token));
    const second = await reset(request("session/reset", input, token));
    expect(first.status).toBe(200);
    expect(await second.json()).toEqual(await first.json());
  });

  it("informa expiração e só cria outra sessão por solicitação explícita", async () => {
    const { token, data } = await session();
    clock = new Date("2026-10-19T12:00:00.000Z");
    expect(
      (await getSession(request("session", undefined, token))).status,
    ).toBe(401);
    const response = await createSession(request("session", {}, token));
    expect(response.status).toBe(201);
    expect((await response.json()).generation).not.toBe(data.generation);
  });

  it("não revela detalhes internos quando a persistência está indisponível", async () => {
    vi.mocked(getGameService).mockImplementation(() => {
      throw new Error("postgresql://segredo@privado");
    });
    const response = await createSession(request("session", {}));
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: { code: "GAME_UNAVAILABLE" },
    });
  });

  it("associa a sessão ao hash do token, não ao token recebido", async () => {
    const { token } = await session();
    const hash = createHash("sha256").update(token).digest("hex");
    await expect(service.getSession(hash)).resolves.toMatchObject({
      balance: 1000,
    });
    await expect(service.getSession(token)).rejects.toThrow("SESSION_REQUIRED");
  });
});
