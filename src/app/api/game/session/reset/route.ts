import type { NextRequest } from "next/server";
import {
  endpoint,
  json,
  readInput,
  sessionHash,
  validateId,
  validateMutation,
  validateVersion,
} from "@/server/game/http";
import { getGameService } from "@/server/game/runtime";

export const runtime = "nodejs";

export function POST(request: NextRequest) {
  return endpoint(async () => {
    validateMutation(request);
    const hash = sessionHash(request);
    const data = await readInput(request, [
      "requestId",
      "generation",
      "version",
    ]);
    const input = {
      requestId: validateId(data.requestId),
      generation: validateId(data.generation),
      version: validateVersion(data.version),
    };
    return json(await getGameService().reset(hash, input));
  });
}
