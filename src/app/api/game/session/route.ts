import type { NextRequest } from "next/server";
import type { GameSession } from "@/features/game/contracts";
import { GameError } from "@/server/game/errors";
import { createSessionSchema } from "@/server/game/validation";
import {
  endpoint,
  json,
  readInput,
  sessionCookie,
  sessionHash,
  tokenFromRequest,
  validateMutation,
} from "@/server/game/http";
import {
  getGameService,
  hashSessionToken,
  newSessionToken,
} from "@/server/game/runtime";

export const runtime = "nodejs";

function sessionResponse(session: GameSession, token: string, status = 200) {
  const response = json(session, status);
  response.cookies.set(sessionCookie, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api",
    expires: new Date(session.expiresAt),
  });
  // Remove the legacy, narrower cookie so it cannot shadow the shared API cookie.
  response.headers.append(
    "Set-Cookie",
    `${sessionCookie}=; Path=/api/game; Max-Age=0; HttpOnly; SameSite=Strict${process.env.NODE_ENV === "production" ? "; Secure" : ""}`,
  );
  return response;
}

export function GET(request: NextRequest) {
  return endpoint(async () => {
    const hash = sessionHash(request);
    return sessionResponse(
      await getGameService().getSession(hash),
      tokenFromRequest(request)!,
    );
  });
}

export function POST(request: NextRequest) {
  return endpoint(async () => {
    validateMutation(request);
    await readInput(request, createSessionSchema);
    const service = getGameService();
    const previous = tokenFromRequest(request);
    if (previous) {
      try {
        return sessionResponse(
          await service.getSession(hashSessionToken(previous)),
          previous,
        );
      } catch (error) {
        if (
          !(error instanceof GameError) ||
          !["SESSION_REQUIRED", "SESSION_EXPIRED"].includes(error.code)
        ) {
          throw error;
        }
      }
    }
    const token = newSessionToken();
    const session = await service.createSession(hashSessionToken(token));
    return sessionResponse(session, token, 201);
  });
}
