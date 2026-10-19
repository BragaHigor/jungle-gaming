import { AxiosError } from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";
import { http } from "@/lib/http";
import {
  getSession,
  postRound,
  postReset,
  getRound,
  GameRequestError,
} from "@/features/game/api/session";
import { round, session } from "./client-fixtures";

const original = http.defaults.adapter;
afterEach(() => {
  http.defaults.adapter = original;
});
function respond(data: unknown) {
  http.defaults.adapter = async (config) => ({
    data,
    config,
    status: 200,
    statusText: "OK",
    headers: {},
  });
}
describe("funções HTTP tipadas do jogo", () => {
  it("não aceita um reinício que conserva a geração anterior", async () => {
    respond({ ...session, version: 1 });
    await expect(
      postReset({
        requestId: round.id,
        generation: session.generation,
        version: 0,
      }),
    ).rejects.toMatchObject({ code: "INVALID_RESPONSE", uncertain: true });
  });
  it("aceita somente sessão com contrato público válido", async () => {
    respond(session);
    await expect(getSession()).resolves.toEqual(session);
    respond({ ...session, balance: "1000" });
    await expect(getSession()).rejects.toMatchObject({
      code: "INVALID_RESPONSE",
      uncertain: true,
    });
  });
  it("envia a intenção sem sortear nem adicionar prêmio no cliente", async () => {
    const adapter = vi.fn(async (config) => ({
      data: round,
      config,
      status: 200,
      statusText: "OK",
      headers: {},
    }));
    http.defaults.adapter = adapter;
    const input = {
      requestId: round.id,
      generation: round.generation,
      bet: round.bet,
    };
    await expect(postRound(input)).resolves.toEqual(round);
    expect(adapter).toHaveBeenCalledTimes(1);
    expect(JSON.parse(adapter.mock.calls[0][0].data)).toEqual(input);
  });
  it("não repete automaticamente o POST após timeout", async () => {
    const adapter = vi.fn(async () => {
      throw new AxiosError("timeout", "ECONNABORTED");
    });
    http.defaults.adapter = adapter;
    await expect(
      postRound({ requestId: round.id, generation: round.generation, bet: 25 }),
    ).rejects.toMatchObject({ code: "NETWORK_ERROR", uncertain: true });
    expect(adapter).toHaveBeenCalledTimes(1);
  });
  it("preserva erro de sessão e distingue recusa de falha incerta", async () => {
    http.defaults.adapter = async (config) => {
      throw new AxiosError(
        "unauthorized",
        "ERR_BAD_REQUEST",
        config,
        undefined,
        {
          data: { error: { code: "SESSION_EXPIRED" } },
          status: 401,
          statusText: "Unauthorized",
          headers: {},
          config,
        },
      );
    };
    await expect(getSession()).rejects.toMatchObject({
      code: "SESSION_EXPIRED",
      uncertain: false,
    });
  });
  it("rejeita uma rodada válida que pertence a outra solicitação", async () => {
    respond({ ...round, id: "33333333-3333-4333-8333-333333333333" });
    await expect(getRound(round.id)).rejects.toMatchObject({
      code: "INVALID_RESPONSE",
      uncertain: true,
    });
    await expect(
      postRound({ requestId: round.id, generation: round.generation, bet: 25 }),
    ).rejects.toBeInstanceOf(GameRequestError);
  });
  it("rejeita símbolos desconhecidos e saldo negativo", async () => {
    respond({ ...round, symbols: ["flower", "unknown", "flower"] });
    await expect(getRound(round.id)).rejects.toThrow("INVALID_RESPONSE");
    respond({ ...round, balance: -10 });
    await expect(getRound(round.id)).rejects.toThrow("INVALID_RESPONSE");
  });
});
