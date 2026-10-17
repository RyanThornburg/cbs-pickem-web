import { verifyAdmin } from "./access.ts";
import { checkPipeline } from "./pipelineAlert.ts";
import { buildRoster, parsePayment, savePayment } from "./roster.ts";

const WEEK_RESOURCE_PATTERN =
  /^\/api\/weeks\/(\d+)\/(\d+)\/(games|leaderboard|odds|trends|recap)$/;
const SEASON_RESOURCE_PATTERN = /^\/api\/season\/(\d+)\/(trends|standings)$/;
const TEAM_PROFILE_PATTERN = /^\/api\/teams\/(\d+)\/(\d+)$/;
const USER_SEASON_PATTERN = /^\/api\/users\/(\d+)\/season\/(\d+)$/;
const GAME_DETAILS_PATTERN = /^\/api\/games\/(\d+)\/(\d+)\/details$/;
const ROSTER_PATTERN = /^\/api\/admin\/roster\/(\d{4})$/;
const ROSTER_USER_PATTERN = /^\/api\/admin\/roster\/(\d{4})\/(\d+)$/;
// KV caches reads at the edge for 60s by default. The games key carries live
// scores, so cache it for Cloudflare's 30s minimum instead.
const GAMES_CACHE_TTL_SECONDS = 30;

export default {
  async fetch(request, env, _ctx): Promise<Response> {
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
        if (resource === "games") {
          return await respondWithKvJson(
            env,
            `week:${season}:${weekPadded}:games`,
            NO_STORE,
            GAMES_CACHE_TTL_SECONDS
          );
        }
        return await respondWithKvJson(
          env,
          `week:${season}:${weekPadded}:${resource}`
        );
      }

      const seasonMatch = pathname.match(SEASON_RESOURCE_PATTERN);
      if (seasonMatch) {
        const [, season, resource] = seasonMatch;
        return await respondWithKvJson(env, `season:${season}:${resource}`);
      }

      const teamMatch = pathname.match(TEAM_PROFILE_PATTERN);
      if (teamMatch) {
        const [, season, teamId] = teamMatch;
        return await respondWithKvJson(env, `team:${season}:${teamId}`);
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

  // Cron trigger (wrangler.jsonc): emails when the data pipeline stops.
  async scheduled(_controller, env, ctx): Promise<void> {
    ctx.waitUntil(checkPipeline(env));
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

  const rosterMatch = pathname.match(ROSTER_PATTERN);
  if (rosterMatch && request.method === "GET") {
    const roster = await buildRoster(env.PICKEM_KV, Number(rosterMatch[1]));
    return roster ? jsonResponse(roster, 200, NO_STORE) : notFound(NO_STORE);
  }

  const rosterUserMatch = pathname.match(ROSTER_USER_PATTERN);
  if (
    rosterUserMatch &&
    (request.method === "PUT" || request.method === "DELETE")
  ) {
    return await handleRosterWrite(
      request,
      env,
      Number(rosterUserMatch[1]),
      Number(rosterUserMatch[2])
    );
  }

  return notFound(NO_STORE);
}

// Saves (PUT) or clears (DELETE) one member's payment. On top of the Access
// check, a write must come from this site's own page (Origin), and a PUT
// must be JSON, which a plain cross-site form can't send.
async function handleRosterWrite(
  request: Request,
  env: Env,
  season: number,
  userId: number
): Promise<Response> {
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return jsonResponse({ error: "forbidden" }, 403, NO_STORE);
  }

  let payment = null;
  if (request.method === "PUT") {
    if (!request.headers.get("content-type")?.startsWith("application/json")) {
      return jsonResponse({ error: "expected JSON" }, 415, NO_STORE);
    }
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: "body isn't valid JSON" }, 400, NO_STORE);
    }
    const parsed = parsePayment(body);
    if (typeof parsed === "string") {
      return jsonResponse({ error: parsed }, 400, NO_STORE);
    }
    payment = parsed;
  }

  const roster = await savePayment(env.PICKEM_KV, season, userId, payment);
  if (!roster) return notFound(NO_STORE);
  console.log(
    JSON.stringify({
      message: payment ? "roster payment saved" : "roster payment cleared",
      season,
      user_id: userId,
    })
  );
  return jsonResponse(roster, 200, NO_STORE);
}

// For admin responses (never cached by the browser or the edge) and live
// games data (the client polls it, so a browser-cached copy would go stale).
const NO_STORE = { "cache-control": "no-store" };

async function respondWithKvJson(
  env: Env,
  key: string,
  extraHeaders?: Record<string, string>,
  cacheTtl?: number
): Promise<Response> {
  const value = await env.PICKEM_KV.get(key, { type: "json", cacheTtl });
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
