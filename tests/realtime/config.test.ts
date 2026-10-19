import { describe, expect, it } from "vitest";
import { realtimeOrigins } from "@/server/realtime/config";

describe("origens do servidor de eventos", () => {
  it("permite localhost somente como padrão fora de produção", () => {
    expect(realtimeOrigins({ NODE_ENV: "development" })).toEqual([
      "http://localhost:3000",
    ]);
    expect(realtimeOrigins({ NODE_ENV: "production" })).toEqual([]);
  });

  it("normaliza e remove repetições das origens explícitas", () => {
    expect(
      realtimeOrigins({
        NODE_ENV: "production",
        REALTIME_ALLOWED_ORIGINS:
          " https://canopy.example/, ,https://canopy.example,https://hml.example ",
      }),
    ).toEqual(["https://canopy.example", "https://hml.example"]);
  });

  it("inclui os hosts do próprio deploy e da branch na Vercel", () => {
    expect(
      realtimeOrigins({
        NODE_ENV: "production",
        VERCEL: "1",
        VERCEL_ENV: "preview",
        VERCEL_URL: "canopy-sha.vercel.app",
        VERCEL_BRANCH_URL: "canopy-develop.vercel.app",
        VERCEL_PROJECT_PRODUCTION_URL: "canopy.vercel.app",
      }),
    ).toEqual([
      "https://canopy-sha.vercel.app",
      "https://canopy-develop.vercel.app",
    ]);
  });

  it("inclui o domínio de produção somente no ambiente de produção da Vercel", () => {
    expect(
      realtimeOrigins({
        NODE_ENV: "production",
        VERCEL: "1",
        VERCEL_ENV: "production",
        VERCEL_URL: "canopy-sha.vercel.app",
        VERCEL_PROJECT_PRODUCTION_URL: "canopy.vercel.app",
      }),
    ).toContain("https://canopy.vercel.app");
    expect(
      realtimeOrigins({
        NODE_ENV: "production",
        VERCEL_URL: "ignored.vercel.app",
      }),
    ).toEqual([]);
  });

  it.each([
    "http://canopy.example",
    "https://user:password@canopy.example",
    "file:///tmp/canopy",
    "*",
  ])("recusa origem insegura em produção: %s", (origin) => {
    expect(() =>
      realtimeOrigins({
        NODE_ENV: "production",
        REALTIME_ALLOWED_ORIGINS: origin,
      }),
    ).toThrow();
  });
});
