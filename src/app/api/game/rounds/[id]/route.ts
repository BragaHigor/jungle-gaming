import type { NextRequest } from "next/server";
import { endpoint, json, sessionHash } from "@/server/game/http";
import { idSchema, parseInput } from "@/server/game/validation";
import { getGameService } from "@/server/game/runtime";

export const runtime = "nodejs";

export function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  return endpoint(async () => {
    const hash = sessionHash(request);
    const id = parseInput(idSchema, (await context.params).id);
    return json(await getGameService().getRound(hash, id));
  });
}
