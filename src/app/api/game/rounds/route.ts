import type { NextRequest } from "next/server";
import {
  endpoint,
  json,
  readInput,
  sessionHash,
  validateId,
  validateMutation,
} from "@/server/game/http";
import { validateBet } from "@/server/game/rules";
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
    const data = await readInput(request, ["requestId", "generation", "bet"]);
    const input = {
      requestId: validateId(data.requestId),
      generation: validateId(data.generation),
      bet: validateBet(data.bet),
    };
    return json(await getGameService().play(hash, input));
  });
}
