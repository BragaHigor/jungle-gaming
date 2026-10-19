import type { NextRequest } from "next/server";
import {
  endpoint,
  json,
  readInput,
  sessionHash,
  validateMutation,
} from "@/server/game/http";
import { getGameService } from "@/server/game/runtime";
import { resetInputSchema } from "@/server/game/validation";

export const runtime = "nodejs";

export function POST(request: NextRequest) {
  return endpoint(async () => {
    validateMutation(request);
    const hash = sessionHash(request);
    const input = await readInput(request, resetInputSchema);
    return json(await getGameService().reset(hash, input));
  });
}
