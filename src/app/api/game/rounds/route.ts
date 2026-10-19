import type { NextRequest } from "next/server";
import {
  endpoint,
  json,
  readInput,
  sessionHash,
  validateMutation,
} from "@/server/game/http";
import { roundInputSchema } from "@/server/game/validation";
import { getGameService } from "@/server/game/runtime";

export const runtime = "nodejs";

export function GET(request: NextRequest) {
  return endpoint(async () => {
    const hash = sessionHash(request);
    return json({ rounds: await getGameService().getHistory(hash) });
  });
}

export function POST(request: NextRequest) {
  return endpoint(async () => {
    validateMutation(request);
    const hash = sessionHash(request);
    const input = await readInput(request, roundInputSchema);
    return json(await getGameService().play(hash, input));
  });
}
