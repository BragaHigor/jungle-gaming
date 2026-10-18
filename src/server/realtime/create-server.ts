import { createServer } from "node:http";
import { Server } from "socket.io";

import {
  realtimePath,
  type RealtimeClientEvents,
  type RealtimeServerEvents,
} from "../../lib/realtime-contracts";

export function createRealtimeServer(allowedOrigins: string[]) {
  const server = createServer((request, response) => {
    response.setHeader("Content-Type", "application/json");
    response.statusCode = request.url === "/health" ? 200 : 404;
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

  io.on("connection", (socket) => {
    socket.on("infrastructure:ping", (reply) => {
      if (typeof reply === "function") reply({ status: "ok" });
    });
  });

  return { server, io };
}
