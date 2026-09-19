const WEEK_RESOURCE_PATTERN =
  /^\/api\/weeks\/(\d+)\/(\d+)\/(games|leaderboard|odds|trends)$/;
const SEASON_TRENDS_PATTERN = /^\/api\/season\/(\d+)\/trends$/;

export default {
  async fetch(request, env, ctx): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;

    if (!pathname.startsWith("/api/")) {
      return env.ASSETS.fetch(request);
    }

    try {
      if (pathname === "/api/meta") {
        return await respondWithKvJson(env, "meta:current");
      }

      if (pathname === "/api/historical") {
        return await respondWithKvJson(env, "meta:historical");
      }

      const weekMatch = pathname.match(WEEK_RESOURCE_PATTERN);
      if (weekMatch) {
        const [, season, week, resource] = weekMatch;
        const weekPadded = week.padStart(2, "0");
        return await respondWithKvJson(
          env,
          `week:${season}:${weekPadded}:${resource}`
        );
      }

      const seasonTrendsMatch = pathname.match(SEASON_TRENDS_PATTERN);
      if (seasonTrendsMatch) {
        const [, season] = seasonTrendsMatch;
        return await respondWithKvJson(env, `season:${season}:trends`);
      }

      return notFound();
    } catch (error) {
      console.error(
        JSON.stringify({
          message: "worker request failed",
          path: pathname,
          error: error instanceof Error ? error.message : String(error),
        })
      );
      return jsonResponse({ error: "internal_error" }, 500);
    }
  },
} satisfies ExportedHandler<Env>;

async function respondWithKvJson(env: Env, key: string): Promise<Response> {
  const value = await env.PICKEM_KV.get(key, "json");
  if (value === null) {
    return notFound();
  }
  return jsonResponse(value, 200);
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function notFound(): Response {
  return jsonResponse({ error: "not_found" }, 404);
}
