import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { createRealtimeServer } from "../src/server/realtime/create-server";

const origins = (
  process.env.REALTIME_ALLOWED_ORIGINS ||
  (process.env.NODE_ENV === "production" ? "" : "http://localhost:3000")
)
  .split(",")
  .filter((origin) => origin.trim())
  .map((origin) => new URL(origin.trim()).origin);

const { server } = createRealtimeServer(origins);

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const port = Number(process.env.REALTIME_PORT || 3001);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("INVALID_REALTIME_PORT");
  }

  server.listen(port, "127.0.0.1", () => {
    console.log(`Realtime service: http://localhost:${port}`);
  });
}

export default server;
