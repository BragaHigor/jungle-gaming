"use client";

import { useEffect, useReducer, useState } from "react";

import {
  createExampleState,
  exampleReducer,
} from "@/features/game/examples/reducer";
import { useGameSound } from "@/features/game/hooks/use-game-sound";
import { useReducedMotion } from "@/features/game/hooks/use-reduced-motion";
import type { Bet } from "@/features/game/presentation";

export function useGameInterface() {
  const [bet, setBet] = useState<Bet>(10);
  const [example, dispatch] = useReducer(
    exampleReducer,
    undefined,
    createExampleState,
  );
  const [reduceExample, setReduceExample] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const reducedMotion = prefersReducedMotion || reduceExample;
  const sound = useGameSound();
  const play = sound.play;

  useEffect(() => {
    if (!example.transition) return;
    const runId = example.runId;
    const timers: ReturnType<typeof setTimeout>[] = [];
    if (example.transition === "spin" && !reducedMotion) {
      [700, 960, 1220].forEach((delay, index) =>
        timers.push(
          setTimeout(
            () => dispatch({ type: "stop-reel", runId, count: index + 1 }),
            delay,
          ),
        ),
      );
    }
    timers.push(
      setTimeout(
        () => dispatch({ type: "finish", runId }),
        reducedMotion ? 0 : example.transition === "recover" ? 900 : 1500,
      ),
    );
    return () => timers.forEach(clearTimeout);
  }, [example.transition, example.runId, reducedMotion]);

  useEffect(() => {
    if (example.view.phase === "win" || example.view.phase === "loss")
      play(example.view.phase === "win");
  }, [example.view.phase, play]);

  return {
    bet,
    setBet,
    example,
    dispatch,
    sound,
    reducedMotion,
    reduceExample,
    setReduceExample,
  };
}

export type GameInterface = ReturnType<typeof useGameInterface>;
