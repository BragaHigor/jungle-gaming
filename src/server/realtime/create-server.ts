import { createServer } from "node:http";
import { Server } from "socket.io";

import {
  realtimePath,
  realtimeHealthPath,
  type RealtimeClientEvents,
  type RealtimeServerEvents,
} from "../../lib/realtime-contracts";
import type { GameNotification } from "./notifications";

interface RealtimeDependencies {
  authorize: (
    cookie: string | undefined,
  ) => Promise<{ sessionHash: string; lifetimeMs: number }>;
  listen: (
    onEvent: (notification: GameNotification) => void,
    onLost: () => void,
  ) => Promise<void>;
}

export function createRealtimeServer(
  allowedOrigins: string[],
  dependencies: RealtimeDependencies,
) {
  const server = createServer((request, response) => {
    response.setHeader("Content-Type", "application/json");
    response.setHeader("Cache-Control", "no-store");
    response.statusCode =
      request.url === "/health" || request.url === realtimeHealthPath
        ? 200
        : 404;
    response.end(
      JSON.stringify({
        status: response.statusCode === 200 ? "ok" : "not_found",
      }),
    );
  });

  const io = new Server<RealtimeClientEvents, RealtimeServerEvents>(server, {
    path: realtimePath,
    transports: ["websocket"],
    serveClient: false,
    cors: { origin: allowedOrigins },
    allowRequest: (request, callback) => {
      const origin = request.headers.origin;
      callback(
        null,
        typeof origin === "string" && allowedOrigins.includes(origin),
      );
    },
  });

  io.use(async (socket, next) => {
    try {
      await dependencies.listen(
        ({ sessionHash, event }) => {
          const room = io.to(sessionHash);
          if (event.type === "round") room.emit("round:completed", event.data);
          else room.emit("session:reset", event.data);
        },
        () => {
          // A socket is not healthy when its database subscription is lost.
          for (const socket of io.sockets.sockets.values()) socket.conn.close();
        },
      );
      const session = await dependencies.authorize(
        socket.request.headers.cookie,
      );
      if (!socket.connected && socket.conn.readyState !== "open") return;
      socket.data.session = session;
      next();
    } catch {
      next(new Error("REALTIME_UNAVAILABLE"));
    }
  });

  io.on("connection", (socket) => {
    const { sessionHash, lifetimeMs } = socket.data.session as Awaited<
      ReturnType<RealtimeDependencies["authorize"]>
    >;
    void socket.join(sessionHash);
    const expiry = setTimeout(
      () => socket.disconnect(true),
      Math.max(0, lifetimeMs),
    );
    socket.once("disconnect", () => clearTimeout(expiry));
    socket.on("infrastructure:ping", (reply) => {
      if (typeof reply === "function") reply({ status: "ok" });
    });
  });

  return { server, io };
}
