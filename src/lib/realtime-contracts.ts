export interface RealtimeClientEvents {
  "infrastructure:ping": (reply: (result: { status: "ok" }) => void) => void;
}

export type RealtimeServerEvents = Record<string, never>;

export const realtimePath = "/api/realtime/socket.io";
