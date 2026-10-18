import { http } from "@/lib/http";

export async function getHealth(signal: AbortSignal) {
  const response = await http.get<{ status?: unknown }>("/health", { signal });

  if (response.data?.status !== "ok") {
    throw new Error("INVALID_HEALTH_RESPONSE");
  }

  return { status: "ok" as const };
}
