import { describe, expect, it, vi } from "vitest";
import {
  applyRound,
  readPending,
  recoverCommand,
  savePending,
  pendingStorageKey,
  type PendingCommand,
} from "@/features/game/session-state";
import { GameRequestError } from "@/features/game/api/session";
import { reelsForLine } from "@/features/game/remote-view";
import { round, session, generation } from "./client-fixtures";

const command: PendingCommand = {
  kind: "round",
  input: { requestId: round.id, generation, bet: 25 },
};
describe("cache e recuperação da mesma intenção", () => {
  it("substitui pelo saldo confirmado sem somar prêmio novamente", () => {
    const updated = applyRound(session, round)!;
    expect(updated.balance).toBe(1100);
    expect(applyRound(updated, round)).toBe(updated);
    expect(updated.history).toHaveLength(1);
  });
  it("descarta resposta antiga e de outra geração", () => {
    const newer = { ...session, version: 3, balance: 800 };
    expect(applyRound(newer, round)).toBe(newer);
    const reset = {
      ...session,
      generation: "33333333-3333-4333-8333-333333333333",
      version: 2,
    };
    expect(applyRound(reset, round)).toBe(reset);
    expect(applyRound(undefined, round)).toBeUndefined();
  });
  it("mantém símbolos do servidor no centro dos três rolos", () => {
    expect(reelsForLine(round.symbols).map((reel) => reel[1])).toEqual(
      round.symbols,
    );
  });
  it("persiste e restaura a intenção após recarregamento sem guardar token", () => {
    const data = new Map<string, string>();
    savePending(
      {
        setItem: (key, value) => {
          data.set(key, value);
        },
      },
      command,
    );
    expect(readPending({ getItem: (key) => data.get(key) ?? null })).toEqual(
      command,
    );
    expect(JSON.parse(data.get(pendingStorageKey)!)).toEqual(command);
    expect(() =>
      readPending({ getItem: () => '{"kind":"round","input":{}}' }),
    ).toThrow();
  });
  it("recupera por GET e mantém a pendência quando 404 ainda é inconclusivo", async () => {
    const api = {
      getRound: vi.fn(async () => {
        throw new GameRequestError("ROUND_NOT_FOUND");
      }),
      getSession: vi.fn(async () => session),
    };
    expect(await recoverCommand(command, undefined, api)).toEqual({
      session,
      resolved: false,
    });
    expect(api.getRound).toHaveBeenCalledWith(round.id, undefined);
    expect(api.getSession).toHaveBeenCalledTimes(1);
  });
  it("recupera rodada já confirmada após perda da resposta sem novo POST", async () => {
    const confirmed = applyRound(session, round)!;
    const api = {
      getRound: vi.fn(async () => round),
      getSession: vi.fn(async () => confirmed),
    };
    expect(await recoverCommand(command, undefined, api)).toEqual({
      session: confirmed,
      resolved: true,
    });
  });
  it("resolve resposta antiga após reinício sem restaurar geração anterior", async () => {
    const reset = {
      ...session,
      generation: "33333333-3333-4333-8333-333333333333",
      version: 2,
    };
    const api = {
      getRound: vi.fn(async () => round),
      getSession: vi.fn(async () => reset),
    };
    expect(await recoverCommand(command, undefined, api)).toEqual({
      session: reset,
      resolved: true,
    });
  });
  it("não presume que reinício sem mudança já terminou", async () => {
    const pending: PendingCommand = {
      kind: "reset",
      input: { requestId: round.id, generation, version: 0 },
    };
    const api = {
      getRound: vi.fn(async () => round),
      getSession: vi.fn(async () => session),
    };
    expect((await recoverCommand(pending, undefined, api)).resolved).toBe(
      false,
    );
    expect(api.getRound).not.toHaveBeenCalled();
    api.getSession.mockResolvedValue({ ...session, version: 1 });
    expect((await recoverCommand(pending, undefined, api)).resolved).toBe(true);
  });
});
