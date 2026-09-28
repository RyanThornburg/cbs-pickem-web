import { verifyAdmin } from "./access";

const WEEK_RESOURCE_PATTERN =
  /^\/api\/weeks\/(\d+)\/(\d+)\/(games|leaderboard|odds|trends)$/;
const SEASON_TRENDS_PATTERN = /^\/api\/season\/(\d+)\/trends$/;
const USER_SEASON_PATTERN = /^\/api\/users\/(\d+)\/season\/(\d+)$/;
const GAME_DETAILS_PATTERN = /^\/api\/games\/(\d+)\/(\d+)\/details$/;

export default {
  async fetch(request, env, ctx): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;

    // Bookmarkable logout: Access owns /cdn-cgi/access/logout on this
    // hostname and clears its session cookie there.
    if (pathname === "/logout") {
      return Response.redirect(`${url.origin}/cdn-cgi/access/logout`, 302);
    }

    if (!pathname.startsWith("/api/")) {
      return env.ASSETS.fetch(request);
    }

    try {
      if (pathname === "/api/admin" || pathname.startsWith("/api/admin/")) {
        return await handleAdmin(request, env, pathname);
      }

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

      const userSeasonMatch = pathname.match(USER_SEASON_PATTERN);
      if (userSeasonMatch) {
        const [, userId, season] = userSeasonMatch;
        return await respondWithKvJson(env, `user:${userId}:season:${season}`);
      }

      const gameDetailsMatch = pathname.match(GAME_DETAILS_PATTERN);
      if (gameDetailsMatch) {
        const [, season, gameId] = gameDetailsMatch;
        return await respondWithKvJson(env, `game:${season}:${gameId}:details`);
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

// Auth runs before route matching so an unauthenticated caller gets the same
// 401 for every /api/admin/* path, real or not.
async function handleAdmin(
  request: Request,
  env: Env,
  pathname: string
): Promise<Response> {
  const email = await verifyAdmin(request, env);
  if (!email) {
    return jsonResponse({ error: "unauthorized" }, 401, NO_STORE);
  }

  if (pathname === "/api/admin/me") {
    return jsonResponse({ admin: true, email }, 200, NO_STORE);
  }

  if (pathname === "/api/admin/status") {
    return await respondWithKvJson(env, "meta:admin", NO_STORE);
  }

  return notFound(NO_STORE);
}

// Admin responses must never be cached by the browser or the edge.
const NO_STORE = { "cache-control": "no-store" };

async function respondWithKvJson(
  env: Env,
  key: string,
  extraHeaders?: Record<string, string>
): Promise<Response> {
  const value = await env.PICKEM_KV.get(key, "json");
  if (value === null) {
    return notFound(extraHeaders);
  }
  return jsonResponse(value, 200, extraHeaders);
}

function jsonResponse(
  body: unknown,
  status: number,
  extraHeaders?: Record<string, string>
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...extraHeaders },
  });
}

function notFound(extraHeaders?: Record<string, string>): Response {
  return jsonResponse({ error: "not_found" }, 404, extraHeaders);
}
