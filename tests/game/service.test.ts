import { randomUUID } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { createGameService } from "@/server/game/game-service";
import { memoryRepository } from "./memory-repository";
import type { WinningLine } from "@/features/game/contracts";

async function setup() {
  const draw = vi.fn<() => WinningLine>(() => ["leaf", "flower", "gem"]);
  const now = vi.fn(() => new Date("2026-10-18T12:00:00.000Z"));
  const { repository, sessions } = memoryRepository(now);
  const service = createGameService({
    repository,
    draw,
    newId: randomUUID,
  });
  const session = await service.createSession("sessao-a");
  const input = {
    requestId: randomUUID(),
    generation: session.generation,
    bet: 25 as const,
  };
  return { service, session, sessions, input, draw, now };
}

describe("serviço de sessão e rodadas", () => {
  it("inicia com mil créditos e não expõe identificador secreto", async () => {
    const { session } = await setup();
    expect(session).toMatchObject({
      balance: 1000,
      version: 0,
      roundCount: 0,
      history: [],
    });
    expect(session).not.toHaveProperty("tokenHash");
  });
  it("reenvia a rodada original sem novo sorteio ou débito", async () => {
    const { service, input, draw } = await setup();
    const round = await service.play("sessao-a", input);
    expect(await service.play("sessao-a", input)).toEqual(round);
    expect(draw).toHaveBeenCalledTimes(1);
    expect(await service.getSession("sessao-a")).toMatchObject({
      balance: 975,
      version: 1,
      roundCount: 1,
    });
  });
  it("rejeita reutilização do identificador com aposta ou geração diferente", async () => {
    const { service, input } = await setup();
    await service.play("sessao-a", input);
    await expect(
      service.play("sessao-a", { ...input, bet: 50 }),
    ).rejects.toThrow("IDEMPOTENCY_CONFLICT");
    await expect(
      service.play("sessao-a", { ...input, generation: randomUUID() }),
    ).rejects.toThrow("IDEMPOTENCY_CONFLICT");
  });
  it("isola consultas e idempotência entre sessões", async () => {
    const { service, input } = await setup();
    const other = await service.createSession("sessao-b");
    await service.play("sessao-a", input);
    await expect(service.getRound("sessao-b", input.requestId)).rejects.toThrow(
      "ROUND_NOT_FOUND",
    );
    expect(await service.getHistory("sessao-b")).toEqual([]);
    await service.play("sessao-b", { ...input, generation: other.generation });
    expect((await service.getSession("sessao-b")).balance).toBe(975);
  });
  it("bloqueia saldo insuficiente sem sortear ou gravar", async () => {
    const { service, input, sessions, draw } = await setup();
    sessions.get("sessao-a")!.balance = 20;
    await expect(service.play("sessao-a", input)).rejects.toThrow(
      "INSUFFICIENT_BALANCE",
    );
    expect(draw).not.toHaveBeenCalled();
    expect((await service.getSession("sessao-a")).version).toBe(0);
  });
  it("expira a sessão sem renovar ao consultar ou jogar", async () => {
    const { service, input, now } = await setup();
    now.mockReturnValue(new Date("2026-10-19T12:00:00.000Z"));
    await expect(service.getSession("sessao-a")).rejects.toThrow(
      "SESSION_EXPIRED",
    );
    await expect(service.play("sessao-a", input)).rejects.toThrow(
      "SESSION_EXPIRED",
    );
  });
  it("limita histórico a cinco sem apagar a rodada recuperável", async () => {
    const { service, input } = await setup();
    await service.play("sessao-a", input);
    for (let i = 0; i < 5; i++)
      await service.play("sessao-a", { ...input, requestId: randomUUID() });
    const history = await service.getHistory("sessao-a");
    expect(history.map((r) => r.sequence)).toEqual([6, 5, 4, 3, 2]);
    expect((await service.getRound("sessao-a", input.requestId)).sequence).toBe(
      1,
    );
  });
  it("reinicia com geração nova sem permitir débito antigo após reinício", async () => {
    const { service, input } = await setup();
    const round = await service.play("sessao-a", input);
    const reset = {
      requestId: randomUUID(),
      generation: input.generation,
      version: 1,
    };
    const result = await service.reset("sessao-a", reset);
    expect(result).toMatchObject({
      balance: 1000,
      version: 2,
      roundCount: 0,
      history: [],
    });
    expect(result.generation).not.toBe(input.generation);
    expect(await service.reset("sessao-a", reset)).toEqual(result);
    expect(await service.play("sessao-a", input)).toEqual(round);
    await expect(
      service.play("sessao-a", { ...input, requestId: randomUUID() }),
    ).rejects.toThrow("SESSION_CHANGED");
    expect((await service.getSession("sessao-a")).balance).toBe(1000);
  });
  it("recusa reinício de versão desatualizada e conflito entre tipos de operação", async () => {
    const { service, input } = await setup();
    await service.play("sessao-a", input);
    await expect(
      service.reset("sessao-a", {
        requestId: randomUUID(),
        generation: input.generation,
        version: 0,
      }),
    ).rejects.toThrow("SESSION_CHANGED");
    await expect(
      service.reset("sessao-a", {
        requestId: input.requestId,
        generation: input.generation,
        version: 1,
      }),
    ).rejects.toThrow("IDEMPOTENCY_CONFLICT");
  });
  it("limita operações sem impedir recuperação de solicitação confirmada", async () => {
    const { service, input, sessions } = await setup();
    const result = await service.play("sessao-a", input);
    sessions.get("sessao-a")!.operationCount = 500;
    expect(await service.play("sessao-a", input)).toEqual(result);
    await expect(
      service.play("sessao-a", { ...input, requestId: randomUUID() }),
    ).rejects.toThrow("SESSION_LIMIT");
  });
});
