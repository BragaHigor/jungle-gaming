import { AxiosError } from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getHealth } from "@/features/game/api/health";
import { GET } from "@/app/api/health/route";
import { http } from "@/lib/http";

const originalAdapter = http.defaults.adapter;

afterEach(() => {
  http.defaults.adapter = originalAdapter;
});

function respondWith(data: unknown) {
  http.defaults.adapter = async (config) => ({
    data,
    config,
    status: 200,
    statusText: "OK",
    headers: {},
  });
}

describe("consulta de disponibilidade da aplicação", () => {
  it("evita cache da resposta usada para conferir o deploy", async () => {
    const response = GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ status: "ok" });
  });

  it("aceita o contrato esperado de disponibilidade", async () => {
    respondWith({ status: "ok" });
    await expect(getHealth(new AbortController().signal)).resolves.toEqual({
      status: "ok",
    });
  });

  it.each([null, {}, { status: "error" }, { status: true }])(
    "rejeita a resposta malformada %j sem informar sucesso",
    async (data) => {
      respondWith(data);
      await expect(getHealth(new AbortController().signal)).rejects.toThrow(
        "INVALID_HEALTH_RESPONSE",
      );
    },
  );

  it("propaga o tempo limite excedido sem informar que a aplicação está disponível", async () => {
    const error = new AxiosError("Request timed out", "ECONNABORTED");
    http.defaults.adapter = async () => {
      throw error;
    };
    await expect(getHealth(new AbortController().signal)).rejects.toBe(error);
  });

  it("cancela uma requisição obsoleta antes de acionar o transporte", async () => {
    const adapter = vi.fn();
    http.defaults.adapter = adapter;
    const controller = new AbortController();
    controller.abort();

    await expect(getHealth(controller.signal)).rejects.toMatchObject({
      code: "ERR_CANCELED",
    });
    expect(adapter).not.toHaveBeenCalled();
  });
});
