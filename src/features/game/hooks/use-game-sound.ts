"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useGameSound() {
  const context = useRef<AudioContext | null>(null);
  const enabledRef = useRef(false);
  const operationRef = useRef(0);
  const pendingRef = useRef(false);
  const [enabled, setEnabled] = useState(false);
  const [pending, setPending] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  const play = useCallback((win = false) => {
    const audio = context.current;
    if (!enabledRef.current || !audio || audio.state !== "running") return;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.frequency.value = win ? 660 : 320;
    gain.gain.setValueAtTime(0.0001, audio.currentTime);
    gain.gain.linearRampToValueAtTime(0.035, audio.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.16);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start();
    oscillator.stop(audio.currentTime + 0.2);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
  }, []);

  async function toggle() {
    if (pendingRef.current) return;
    if (enabledRef.current) {
      enabledRef.current = false;
      setEnabled(false);
      return;
    }
    pendingRef.current = true;
    const operation = ++operationRef.current;
    setPending(true);
    try {
      if (!context.current || context.current.state === "closed")
        context.current = new AudioContext();
      const audio = context.current;
      await audio.resume();
      if (operation !== operationRef.current || context.current !== audio)
        return;
      enabledRef.current = audio.state === "running";
      setEnabled(enabledRef.current);
      setUnavailable(!enabledRef.current);
      play();
    } catch {
      if (operation === operationRef.current) setUnavailable(true);
    } finally {
      if (operation === operationRef.current) {
        pendingRef.current = false;
        setPending(false);
      }
    }
  }

  useEffect(
    () => () => {
      enabledRef.current = false;
      operationRef.current++;
      pendingRef.current = false;
      const audio = context.current;
      context.current = null;
      if (audio && audio.state !== "closed") void audio.close();
    },
    [],
  );

  return { enabled, pending, unavailable, toggle, play };
}
