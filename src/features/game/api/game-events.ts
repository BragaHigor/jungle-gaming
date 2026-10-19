"use client";

import { createRealtimeClient } from "./realtime";
import { roundSchema, sessionResetEventSchema } from "./schemas";

export type ConnectionStatus =
  "idle" | "connecting" | "connected" | "reconnecting" | "offline";
interface Callbacks {
  status: (status: ConnectionStatus) => void;
  synchronize: (version?: number) => void;
}

export function subscribeToGameEvents(
  callbacks: Callbacks,
  socket = createRealtimeClient(),
) {
  const connected = () => {
    callbacks.status("connected");
    // Includes the first connection: changes may have occurred during the handshake.
    callbacks.synchronize();
  };
  const disconnected = () =>
    callbacks.status(socket.active ? "reconnecting" : "offline");
  const failed = () =>
    callbacks.status(socket.active ? "reconnecting" : "offline");
  const retrying = () => callbacks.status("reconnecting");
  const exhausted = () => callbacks.status("offline");
  const round = (data: unknown) => {
    const result = roundSchema.safeParse(data);
    if (result.success) callbacks.synchronize(result.data.version);
  };
  const reset = (data: unknown) => {
    const result = sessionResetEventSchema.safeParse(data);
    if (result.success) callbacks.synchronize(result.data.version);
  };
  socket.on("connect", connected);
  socket.on("disconnect", disconnected);
  socket.on("connect_error", failed);
  socket.on("round:completed", round);
  socket.on("session:reset", reset);
  socket.io.on("reconnect_attempt", retrying);
  socket.io.on("reconnect_failed", exhausted);
  callbacks.status("connecting");
  socket.connect();

  return {
    reconnect() {
      if (socket.connected) callbacks.synchronize();
      else {
        callbacks.status("connecting");
        socket.connect();
      }
    },
    close() {
      socket.off("connect", connected);
      socket.off("disconnect", disconnected);
      socket.off("connect_error", failed);
      socket.off("round:completed", round);
      socket.off("session:reset", reset);
      socket.io.off("reconnect_attempt", retrying);
      socket.io.off("reconnect_failed", exhausted);
      socket.disconnect();
    },
  };
}
