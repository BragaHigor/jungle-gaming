import { NextResponse, type NextRequest } from "next/server";
import type { GameApiError, GameErrorCode } from "@/features/game/contracts";
import { GameError } from "./errors";
import { hashSessionToken } from "./runtime";

export const sessionCookie = "canopy-session";
const uuidPattern =
  /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const statusCodes: Record<GameErrorCode, number> = {
  INVALID_INPUT: 400,
  SESSION_REQUIRED: 401,
  SESSION_EXPIRED: 401,
  SESSION_CHANGED: 409,
  SESSION_LIMIT: 409,
  INSUFFICIENT_BALANCE: 409,
  IDEMPOTENCY_CONFLICT: 409,
  ROUND_NOT_FOUND: 404,
  FORBIDDEN_ORIGIN: 403,
  UNSUPPORTED_MEDIA_TYPE: 415,
  PAYLOAD_TOO_LARGE: 413,
  GAME_UNAVAILABLE: 503,
};

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function endpoint(work: () => Promise<NextResponse>) {
  try {
    return await work();
  } catch (error) {
    const code = error instanceof GameError ? error.code : "GAME_UNAVAILABLE";
    return json({ error: { code } } satisfies GameApiError, statusCodes[code]);
  }
}

export function tokenFromRequest(request: NextRequest) {
  const token = request.cookies.get(sessionCookie)?.value;
  return token && /^[a-f0-9]{64}$/.test(token) ? token : null;
}

export function sessionHash(request: NextRequest) {
  const token = tokenFromRequest(request);
  if (!token) throw new GameError("SESSION_REQUIRED");
  return hashSessionToken(token);
}

export function validateMutation(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    throw new GameError("FORBIDDEN_ORIGIN");
  }
  if (
    request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !==
    "application/json"
  ) {
    throw new GameError("UNSUPPORTED_MEDIA_TYPE");
  }
}

export function validateId(value: unknown): string {
  if (typeof value !== "string" || !uuidPattern.test(value)) {
    throw new GameError("INVALID_INPUT");
  }
  return value.toLowerCase();
}

export function validateVersion(value: unknown): number {
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value < 0 ||
    value > 500
  ) {
    throw new GameError("INVALID_INPUT");
  }
  return value;
}

export async function readInput(request: NextRequest, keys: readonly string[]) {
  const reader = request.body?.getReader();
  if (!reader) throw new GameError("INVALID_INPUT");
  let size = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 4_096) {
        await reader.cancel();
        throw new GameError("PAYLOAD_TOO_LARGE");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  let data: unknown;
  try {
    data = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new GameError("INVALID_INPUT");
  }
  if (
    !data ||
    typeof data !== "object" ||
    Array.isArray(data) ||
    Object.keys(data).length !== keys.length ||
    !keys.every((key) => Object.hasOwn(data, key))
  ) {
    throw new GameError("INVALID_INPUT");
  }
  return data as Record<string, unknown>;
}
