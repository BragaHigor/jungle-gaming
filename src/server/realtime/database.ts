import { createHash } from "node:crypto";
import { Client, Pool } from "pg";
import {
  notificationChannel,
  notificationSchema,
  type GameNotification,
} from "./notifications";

// LISTEN needs a dedicated connection; Neon's transaction pooler cannot retain it.
export function directConnectionUrl(connectionString: string) {
  const url = new URL(connectionString);
  if (url.hostname.endsWith(".neon.tech"))
    url.hostname = url.hostname.replace("-pooler.", ".");
  return url.toString();
}

export function createRealtimeDatabase(
  connectionString: string,
  directUrl = directConnectionUrl(connectionString),
) {
  const pool = new Pool({
    connectionString,
    max: 2,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 10_000,
  });
  pool.on("error", () => console.error("REALTIME_DATABASE_CONNECTION_ERROR"));
  let listener: Client | undefined;
  let listening: Promise<void> | undefined;
  let closed = false;

  return {
    async authorize(cookie: string | undefined) {
      const token = cookie?.match(
        /(?:^|;\s*)canopy-session=([a-f0-9]{64})(?:;|$)/,
      )?.[1];
      if (!token) throw new Error("SESSION_REQUIRED");
      const sessionHash = createHash("sha256").update(token).digest("hex");
      const { rows } = await pool.query<{ remaining: number }>(
        "SELECT extract(epoch from (expires_at - clock_timestamp())) * 1000 AS remaining FROM game_sessions WHERE token_hash=$1 AND expires_at > clock_timestamp()",
        [sessionHash],
      );
      if (!rows[0]) throw new Error("SESSION_EXPIRED");
      return { sessionHash, lifetimeMs: Number(rows[0].remaining) };
    },
    listen(
      onEvent: (notification: GameNotification) => void,
      onLost: () => void,
    ) {
      if (closed) return Promise.reject(new Error("REALTIME_CLOSED"));
      if (listening) return listening;
      const client = new Client({
        connectionString: directUrl,
        connectionTimeoutMillis: 5_000,
        keepAlive: true,
      });
      listener = client;
      function lost() {
        if (listener !== client) return;
        listener = undefined;
        listening = undefined;
        void client.end().catch(() => undefined);
        if (!closed) onLost();
      }
      client.on("error", lost);
      client.on("end", lost);
      client.on("notification", ({ channel, payload }) => {
        if (channel !== notificationChannel || !payload) return;
        try {
          const parsed = notificationSchema.safeParse(JSON.parse(payload));
          if (parsed.success) onEvent(parsed.data);
        } catch {
          /* Ignore unrelated or malformed database notifications. */
        }
      });
      listening = (async () => {
        try {
          await client.connect();
          await client.query(`LISTEN ${notificationChannel}`);
        } catch {
          lost();
          throw new Error("REALTIME_UNAVAILABLE");
        }
      })();
      return listening;
    },
    async close() {
      closed = true;
      const client = listener;
      listener = undefined;
      await Promise.all([client?.end().catch(() => undefined), pool.end()]);
    },
  };
}
