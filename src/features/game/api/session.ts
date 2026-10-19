import axios, { type AxiosResponse } from "axios";
import type { z } from "zod";
import { http } from "@/lib/http";
import type { GameErrorCode, ResetInput, RoundInput } from "../contracts";
import { errorSchema, roundSchema, sessionSchema } from "./schemas";

export type ClientErrorCode =
  GameErrorCode | "NETWORK_ERROR" | "INVALID_RESPONSE" | "STORAGE_UNAVAILABLE";
export class GameRequestError extends Error {
  constructor(
    public readonly code: ClientErrorCode,
    public readonly uncertain = false,
  ) {
    super(code);
    this.name = "GameRequestError";
  }
}
export function gameError(error: unknown) {
  return error instanceof GameRequestError
    ? error
    : new GameRequestError("NETWORK_ERROR", true);
}

async function request<T>(
  schema: z.ZodType<T>,
  send: () => Promise<AxiosResponse<unknown>>,
) {
  try {
    const response = await send();
    const result = schema.safeParse(response.data);
    if (!result.success) throw new GameRequestError("INVALID_RESPONSE", true);
    return result.data;
  } catch (error) {
    if (error instanceof GameRequestError) throw error;
    if (axios.isAxiosError<unknown>(error)) {
      const parsed = errorSchema.safeParse(error.response?.data);
      if (parsed.success)
        throw new GameRequestError(
          parsed.data.error.code,
          (error.response?.status ?? 500) >= 500,
        );
    }
    throw new GameRequestError("NETWORK_ERROR", true);
  }
}

export const getSession = (signal?: AbortSignal) =>
  request(sessionSchema, () => http.get<unknown>("/game/session", { signal }));
export const createSession = () =>
  request(sessionSchema, () => http.post<unknown>("/game/session", {}));
export async function postRound(input: RoundInput) {
  const round = await request(roundSchema, () =>
    http.post<unknown>("/game/rounds", input),
  );
  if (
    round.id !== input.requestId ||
    round.generation !== input.generation ||
    round.bet !== input.bet
  )
    throw new GameRequestError("INVALID_RESPONSE", true);
  return round;
}
export async function postReset(input: ResetInput) {
  const session = await request(sessionSchema, () =>
    http.post<unknown>("/game/session/reset", input),
  );
  if (
    session.generation === input.generation ||
    session.version !== input.version + 1
  )
    throw new GameRequestError("INVALID_RESPONSE", true);
  return session;
}
export async function getRound(id: string, signal?: AbortSignal) {
  const round = await request(roundSchema, () =>
    http.get<unknown>(`/game/rounds/${encodeURIComponent(id)}`, { signal }),
  );
  if (round.id !== id.toLowerCase())
    throw new GameRequestError("INVALID_RESPONSE", true);
  return round;
}
