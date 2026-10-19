import type { Round } from "@/features/game/contracts";

export interface RealtimeClientEvents {
  "infrastructure:ping": (reply: (result: { status: "ok" }) => void) => void;
}

export interface SessionResetEvent {
  id: string;
  generation: string;
  version: number;
}

export interface RealtimeServerEvents {
  "round:completed": (round: Round) => void;
  "session:reset": (event: SessionResetEvent) => void;
}

export const realtimePath = "/api/realtime/socket.io";
export const realtimeHealthPath = "/api/realtime/health";
