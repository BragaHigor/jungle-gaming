type RealtimeEnvironment = {
  NODE_ENV?: string;
  REALTIME_ALLOWED_ORIGINS?: string;
  VERCEL?: string;
  VERCEL_ENV?: string;
  VERCEL_URL?: string;
  VERCEL_BRANCH_URL?: string;
  VERCEL_PROJECT_PRODUCTION_URL?: string;
};

export function realtimeOrigins(env: RealtimeEnvironment) {
  const configured = env.REALTIME_ALLOWED_ORIGINS?.split(",") ?? [];
  const origins = configured
    .filter((origin) => origin.trim())
    .map((origin) => {
      const url = new URL(origin.trim());
      if (
        !["http:", "https:"].includes(url.protocol) ||
        url.username ||
        url.password ||
        (env.NODE_ENV === "production" && url.protocol !== "https:")
      )
        throw new Error("INVALID_REALTIME_ORIGIN");
      return url.origin;
    });

  if (env.VERCEL === "1") {
    for (const host of [
      env.VERCEL_URL,
      env.VERCEL_BRANCH_URL,
      ...(env.VERCEL_ENV === "production"
        ? [env.VERCEL_PROJECT_PRODUCTION_URL]
        : []),
    ]) {
      if (host) origins.push(new URL(`https://${host}`).origin);
    }
  }

  if (!origins.length && env.NODE_ENV !== "production")
    origins.push("http://localhost:3000");

  return [...new Set(origins)];
}
