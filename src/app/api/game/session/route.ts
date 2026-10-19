import type { NextRequest } from "next/server";
import { GameError } from "@/server/game/errors";
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

export function GET(request: NextRequest) {
  return endpoint(async () => {
    const hash = sessionHash(request);
    return json(await getGameService().getSession(hash));
  });
}

export function POST(request: NextRequest) {
  return endpoint(async () => {
    validateMutation(request);
    await readInput(request, []);
    const service = getGameService();
    const previous = tokenFromRequest(request);
    if (previous) {
      try {
        return json(await service.getSession(hashSessionToken(previous)));
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
    const response = json(session, 201);
    response.cookies.set(sessionCookie, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/api/game",
      expires: new Date(session.expiresAt),
    });
    return response;
  });
}
