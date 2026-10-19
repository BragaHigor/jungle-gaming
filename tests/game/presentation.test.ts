import { describe, expect, it } from "vitest";

import {
  createExampleState,
  exampleReducer,
} from "@/features/game/examples/reducer";
import { createExample } from "@/features/game/examples/scenarios";
import { createUnavailableView } from "@/features/game/presentation";

describe("apresentação isolada do jogo", () => {
  it("não inventa saldo ou histórico antes de existir uma sessão", () => {
    const view = createUnavailableView(25);
    expect(view.balance).toBeNull();
    expect(view.history).toEqual([]);
    expect(view.bet).toBe(25);
    expect(view.phase).toBe("unavailable");
  });

  it("mantém saldo e histórico enquanto apenas os rolos são animados", () => {
    const initial = createExampleState();
    const spinning = exampleReducer(initial, { type: "animate" });
    const stopped = exampleReducer(spinning, {
      type: "stop-reel",
      runId: spinning.runId,
      count: 1,
    });
    expect(stopped.view.balance).toBe(initial.view.balance);
    expect(stopped.view.history).toEqual(initial.view.history);
    expect(stopped.view.stoppedReels).toBe(1);
    expect(exampleReducer(spinning, { type: "animate" })).toBe(spinning);
    expect(exampleReducer(spinning, { type: "reset" })).toBe(spinning);
  });

  it("ignora o término de uma animação substituída por outro cenário", () => {
    const spinning = exampleReducer(createExampleState(), { type: "animate" });
    const failed = exampleReducer(spinning, {
      type: "select",
      scenario: "failed",
    });
    expect(
      exampleReducer(failed, { type: "finish", runId: spinning.runId }),
    ).toBe(failed);
    expect(
      exampleReducer(failed, {
        type: "stop-reel",
        runId: spinning.runId,
        count: 3,
      }),
    ).toBe(failed);
  });

  it("não duplica prêmio ou histórico ao receber a conclusão duas vezes", () => {
    const spinning = exampleReducer(createExampleState(), { type: "animate" });
    const finished = exampleReducer(spinning, {
      type: "finish",
      runId: spinning.runId,
    });
    expect(finished.view).toEqual(createExample("win"));
    expect(finished.view.history).toHaveLength(5);
    expect(
      exampleReducer(finished, { type: "finish", runId: spinning.runId }),
    ).toBe(finished);
  });

  it("preserva os dados desconhecidos durante a recuperação e bloqueia reinício", () => {
    const failed = exampleReducer(createExampleState(), {
      type: "select",
      scenario: "failed",
    });
    const recovering = exampleReducer(failed, { type: "recover" });
    expect(recovering.view.phase).toBe("verifying");
    expect(recovering.view.balance).toBe(failed.view.balance);
    expect(exampleReducer(recovering, { type: "reset" })).toBe(recovering);
    expect(exampleReducer(recovering, { type: "recover" })).toBe(recovering);
  });

  it("reinicia somente o exemplo e invalida seus eventos anteriores", () => {
    const win = exampleReducer(createExampleState(), {
      type: "select",
      scenario: "win",
    });
    const reset = exampleReducer(win, { type: "reset" });
    expect(reset.view).toEqual(createExample("ready"));
    expect(reset.view.history).toEqual([]);
    expect(reset.runId).toBeGreaterThan(win.runId);
  });
});
