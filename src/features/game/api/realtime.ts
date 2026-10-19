"use client";

import { io, type Socket } from "socket.io-client";

import {
  realtimePath,
  type RealtimeClientEvents,
  type RealtimeServerEvents,
} from "@/lib/realtime-contracts";

export function createRealtimeClient(): Socket<
  RealtimeServerEvents,
  RealtimeClientEvents
> {
  const url =
    process.env.NEXT_PUBLIC_REALTIME_URL ||
    (process.env.NODE_ENV === "development"
      ? "http://localhost:3001"
      : undefined);

  return io(url, {
    path: process.env.NEXT_PUBLIC_REALTIME_PATH || realtimePath,
    transports: ["websocket"],
    autoConnect: false,
    reconnectionAttempts: 3,
    reconnectionDelay: 1_000,
    reconnectionDelayMax: 5_000,
    withCredentials: true,
    timeout: 8_000,
  });
}
