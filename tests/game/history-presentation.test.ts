import { describe, expect, it } from "vitest";
import { remoteView } from "@/features/game/remote-view";
import { applyRound } from "@/features/game/session-state";
import { round, session } from "./client-fixtures";

describe("revelação do histórico após o giro", () => {
  const previous = {
    ...session,
    history: Array.from({ length: 5 }, (_, index) => ({
      ...round,
      id: `anterior-${index}`,
      sequence: 5 - index,
    })),
  };
  const result = { ...round, sequence: 6 };
  const confirmed = applyRound(previous, result)!;
  const controller = {
    session: confirmed,
    historyBeforeSpin: previous,
    pending: null,
    phase: "idle" as const,
    animation: null,
    error: null,
    loading: false,
  };

  it.each(["sending", "checking", "idle"] as const)(
    "preserva as cinco rodadas anteriores na fase %s mesmo com resposta confirmada",
    (phase) => {
      const view = remoteView({ ...controller, phase }, 25);
      expect(view.history.map(({ id }) => id)).toEqual([5, 4, 3, 2, 1]);
    },
  );

  it.each([0, 1, 2, 3])(
    "não revela a nova rodada durante a animação com %i rolos parados",
    (stopped) => {
      const view = remoteView(
        { ...controller, animation: { round: result, stopped } },
        25,
      );
      expect(view.history.map(({ id }) => id)).toEqual([5, 4, 3, 2, 1]);
    },
  );

  it("revela a nova rodada uma única vez ao liberar a apresentação", () => {
    const view = remoteView({ ...controller, historyBeforeSpin: null }, 25);
    expect(view.history.map(({ id }) => id)).toEqual([6, 5, 4, 3, 2]);
    expect(view.balance).toBe(result.balance);
  });

  it("não mantém histórico de uma sessão anterior após reinício", () => {
    const view = remoteView(
      { ...controller, session: { ...session, generation: "nova-geração" } },
      25,
    );
    expect(view.history).toEqual([]);
  });
});
