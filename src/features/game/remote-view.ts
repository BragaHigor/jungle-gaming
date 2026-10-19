import type { Bet, WinningLine } from "./contracts";
import {
  createUnavailableView,
  symbols,
  type GameView,
  type Reels,
} from "./presentation";
import type { GameSessionController } from "./hooks/use-game-session";

export function reelsForLine(line: WinningLine): Reels {
  const reel = (symbol: WinningLine[number]) => {
    const index = symbols.indexOf(symbol);
    return [
      symbols[(index + 3) % 4],
      symbol,
      symbols[(index + 1) % 4],
    ] as const;
  };
  return [reel(line[0]), reel(line[1]), reel(line[2])];
}

export function remoteView(
  controller: Pick<
    GameSessionController,
    | "session"
    | "pending"
    | "phase"
    | "animation"
    | "historyBeforeSpin"
    | "error"
    | "loading"
  >,
  bet: Bet,
): GameView {
  const { session, pending, animation, phase, error, loading } = controller;
  const history =
    controller.historyBeforeSpin?.generation === session?.generation
      ? controller.historyBeforeSpin?.history
      : session?.history;
  const latest = animation?.round ?? session?.history[0];
  const view: GameView = {
    ...createUnavailableView(bet),
    balance: session?.balance ?? null,
    history:
      history?.map((round) => ({
        id: round.sequence,
        symbols: round.symbols,
        bet: round.bet,
        prize: round.prize,
      })) ?? [],
    reels: latest
      ? reelsForLine(latest.symbols)
      : createUnavailableView(bet).reels,
    prize: latest?.prize ?? 0,
    phase: latest ? (latest.prize > 0 ? "win" : "loss") : "ready",
  };
  if (phase === "sending")
    return { ...view, phase: "spinning", stoppedReels: 0 };
  if (phase === "checking") return { ...view, phase: "verifying" };
  if (pending) return { ...view, phase: "failed" };
  if (loading) return { ...view, phase: "loading" };
  if (error === "SESSION_REQUIRED" || error === "SESSION_EXPIRED")
    return { ...view, phase: "unavailable" };
  if (error)
    return {
      ...view,
      phase: error === "INSUFFICIENT_BALANCE" ? "insufficient" : "failed",
    };
  if (!session) return { ...view, phase: "unavailable" };
  if (animation)
    return { ...view, phase: "stopping", stoppedReels: animation.stopped };
  if (session.balance < bet) return { ...view, phase: "insufficient" };
  return view;
}
