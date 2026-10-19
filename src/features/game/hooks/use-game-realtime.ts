"use client";

import { useEffect, useRef, useState } from "react";
import {
  subscribeToGameEvents,
  type ConnectionStatus,
} from "../api/game-events";

export function useGameRealtime(
  enabled: boolean,
  synchronize: (version?: number) => void,
) {
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const callback = useRef(synchronize);
  const subscription = useRef<ReturnType<typeof subscribeToGameEvents> | null>(
    null,
  );
  useEffect(() => {
    callback.current = synchronize;
  });
  useEffect(() => {
    if (!enabled) return;
    const events = subscribeToGameEvents({
      status: setStatus,
      synchronize: (version) => callback.current(version),
    });
    subscription.current = events;
    return () => {
      subscription.current = null;
      events.close();
    };
  }, [enabled]);
  return {
    status: enabled ? status : ("idle" as const),
    reconnect: () => subscription.current?.reconnect(),
  };
}
