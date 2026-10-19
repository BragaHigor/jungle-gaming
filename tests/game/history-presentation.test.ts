import { describe, expect, it } from "vitest";
import { remoteView } from "@/features/game/remote-view";
import { applyRound } from "@/features/game/session-state";
import { round, session } from "./client-fixtures";

describe("revelação dos dados da rodada após o giro", () => {
  const previous = {
    ...session,
    history: Array.from({ length: 5 }, (_, index) => ({
      ...round,
      prize: 0,
      symbols: ["leaf", "flower", "gem"] as const,
      id: `anterior-${index}`,
      sequence: 5 - index,
    })),
  };
  const result = { ...round, sequence: 6 };
  const confirmed = applyRound(previous, result)!;
  const controller = {
    session: confirmed,
    sessionBeforeSpin: previous,
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
      expect(view.balance).toBe(previous.balance);
      expect(view.prize).toBe(0);
      expect(view.reels.map((reel) => reel[1])).toEqual(
        previous.history[0].symbols,
      );
      if (phase === "sending" || phase === "checking") {
        expect(view.phase).toBe("spinning");
        expect(view.stoppedReels).toBe(0);
      }
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
      expect(view.balance).toBe(previous.balance);
      expect(view.prize).toBe(0);
      expect(view.phase).toBe("stopping");
    },
  );

  it("revela a nova rodada uma única vez ao liberar a apresentação", () => {
    const view = remoteView({ ...controller, sessionBeforeSpin: null }, 25);
    expect(view.history.map(({ id }) => id)).toEqual([6, 5, 4, 3, 2]);
    expect(view.balance).toBe(result.balance);
    expect(view.prize).toBe(result.prize);
    expect(view.phase).toBe("win");
  });

  it("não mantém histórico de uma sessão anterior após reinício", () => {
    const view = remoteView(
      { ...controller, session: { ...session, generation: "nova-geração" } },
      25,
    );
    expect(view.history).toEqual([]);
    expect(view.balance).toBe(session.balance);
  });

  it("mantém o saldo inicial e o histórico vazio durante a primeira rodada", () => {
    const view = remoteView(
      {
        ...controller,
        sessionBeforeSpin: session,
        animation: { round: result, stopped: 2 },
      },
      25,
    );
    expect(view.balance).toBe(session.balance);
    expect(view.history).toEqual([]);
    expect(view.prize).toBe(0);
    expect(view.phase).toBe("stopping");
  });

  it("só apresenta saldo insuficiente depois de concluir a animação", () => {
    const depleted = { ...confirmed, balance: 5 };
    const spinning = remoteView(
      {
        ...controller,
        session: depleted,
        animation: { round: result, stopped: 2 },
      },
      25,
    );
    expect(spinning.balance).toBe(previous.balance);
    expect(spinning.phase).toBe("stopping");
    const finished = remoteView(
      { ...controller, session: depleted, sessionBeforeSpin: null },
      25,
    );
    expect(finished.balance).toBe(5);
    expect(finished.phase).toBe("insufficient");
  });

  it("mantém a parada dos rolos até o fim mesmo se a atualização HTTP falhar", () => {
    const view = remoteView(
      {
        ...controller,
        error: "NETWORK_ERROR",
        animation: { round: result, stopped: 1 },
      },
      25,
    );
    expect(view.phase).toBe("stopping");
    expect(view.balance).toBe(previous.balance);
    expect(view.prize).toBe(0);
    expect(
      remoteView(
        { ...controller, sessionBeforeSpin: null, error: "NETWORK_ERROR" },
        25,
      ).phase,
    ).toBe("failed");
  });
});
