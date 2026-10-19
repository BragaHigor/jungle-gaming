import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { createRealtimeServer } from "../src/server/realtime/create-server";
import { createRealtimeDatabase } from "../src/server/realtime/database";
import { realtimeOrigins } from "../src/server/realtime/config";

const origins = realtimeOrigins(process.env);

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL_REQUIRED");
const database = createRealtimeDatabase(
  process.env.DATABASE_URL,
  process.env.REALTIME_DATABASE_URL || undefined,
);
const { server } = createRealtimeServer(origins, database);
server.once("close", () => void database.close());

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
