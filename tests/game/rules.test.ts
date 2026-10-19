import { describe, expect, it } from "vitest";
import { calculatePrize, settleRound, validateBet } from "@/server/game/rules";
import type { GameSymbol } from "@/features/game/contracts";

describe("regras de créditos fictícios", () => {
  it.each([10, 25, 50])("aceita a aposta %i", (bet) => {
    expect(validateBet(bet)).toBe(bet);
  });
  it.each([null, undefined, "10", 0, -10, 1.5, NaN, Infinity, 100, {}, true])(
    "rejeita aposta inválida %j",
    (bet) => {
      expect(() => validateBet(bet)).toThrow("INVALID_INPUT");
    },
  );
  it.each<[GameSymbol, number]>([
    ["leaf", 3],
    ["flower", 5],
    ["cherry", 8],
    ["gem", 15],
  ])("premia três símbolos %s com multiplicador %i", (symbol, multiplier) => {
    expect(calculatePrize(25, [symbol, symbol, symbol])).toBe(25 * multiplier);
    expect(settleRound(1000, 25, [symbol, symbol, symbol])).toEqual({
      prize: 25 * multiplier,
      balance: 975 + 25 * multiplier,
    });
  });
  it("desconta a aposta uma vez quando não há combinação", () => {
    expect(settleRound(50, 50, ["gem", "leaf", "gem"])).toEqual({
      prize: 0,
      balance: 0,
    });
  });
  it("não permite saldo negativo", () => {
    expect(() => settleRound(20, 25, ["gem", "gem", "gem"])).toThrow(
      "INSUFFICIENT_BALANCE",
    );
  });
});
