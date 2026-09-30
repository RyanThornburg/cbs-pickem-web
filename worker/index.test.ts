import { describe, it } from "node:test";
import assert from "node:assert/strict";
import worker from "./index.ts";
import { ADMIN_EMAIL, accessToken, testEnv } from "./testHelpers.ts";

// A KV stand-in that records every read, and an assets binding that echoes
// the path it was asked for.
const setup = (kv: Record<string, unknown> = {}, { kvThrows = false } = {}) => {
  const reads: { key: string; cacheTtl?: number }[] = [];
  const env = testEnv({
    PICKEM_KV: {
      get: async (
        key: string,
        options: { type: string; cacheTtl?: number }
      ) => {
        reads.push({ key, cacheTtl: options.cacheTtl });
        if (kvThrows) throw new Error("KV down");
        return key in kv ? kv[key] : null;
      },
    },
    ASSETS: {
      fetch: async (request: Request) =>
        new Response(`asset:${new URL(request.url).pathname}`),
    },
  });
  const get = (path: string, headers: Record<string, string> = {}) =>
    worker.fetch(
      new Request(`https://morlocked.test${path}`, { headers }) as Parameters<
        typeof worker.fetch
      >[0],
      env,
      {} as ExecutionContext
    );
  return { get, reads };
};

describe("worker routes", () => {
  it("maps each public route to its KV key", async () => {
    const cases: [string, string][] = [
      ["/api/meta", "meta:current"],
      ["/api/historical", "meta:historical"],
      ["/api/weeks/2026/3/leaderboard", "week:2026:03:leaderboard"],
      ["/api/weeks/2026/3/odds", "week:2026:03:odds"],
      ["/api/weeks/2026/3/trends", "week:2026:03:trends"],
      ["/api/weeks/2026/3/recap", "week:2026:03:recap"],
      ["/api/weeks/2026/12/recap", "week:2026:12:recap"],
      ["/api/season/2026/trends", "season:2026:trends"],
      ["/api/users/35/season/2026", "user:35:season:2026"],
      ["/api/games/2026/43/details", "game:2026:43:details"],
    ];
    for (const [path, key] of cases) {
      const { get, reads } = setup({ [key]: { key } });
      const response = await get(path);
      assert.equal(response.status, 200, path);
      assert.deepEqual(await response.json(), { key }, path);
      assert.equal(response.headers.get("content-type"), "application/json");
      assert.deepEqual(
        reads.map((r) => r.key),
        [key],
        path
      );
    }
  });

  it("serves games with a 30s edge cache and no-store for the browser", async () => {
    const { get, reads } = setup({ "week:2026:03:games": { games: [] } });
    const response = await get("/api/weeks/2026/3/games");
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal(reads[0].cacheTtl, 30);
  });

  it("404s a missing key", async () => {
    const { get } = setup();
    const response = await get("/api/weeks/2026/3/recap");
    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { error: "not_found" });
  });

  it("404s unknown API paths without reading KV, including the old tidbits route", async () => {
    for (const path of [
      "/api/weeks/2026/3/tidbits",
      "/api/weeks/2026/3",
      "/api/weeks/x/3/games",
      "/api/nope",
      "/api/meta/extra",
    ]) {
      const { get, reads } = setup();
      assert.equal((await get(path)).status, 404, path);
      assert.equal(reads.length, 0, path);
    }
  });

  it("returns 500 when KV fails", async () => {
    const { get } = setup({}, { kvThrows: true });
    const original = console.error;
    console.error = () => {};
    try {
      const response = await get("/api/meta");
      assert.equal(response.status, 500);
      assert.deepEqual(await response.json(), { error: "internal_error" });
    } finally {
      console.error = original;
    }
  });

  it("hands everything outside /api to the static assets", async () => {
    const { get, reads } = setup();
    assert.equal(await (await get("/trends")).text(), "asset:/trends");
    assert.equal(await (await get("/")).text(), "asset:/");
    assert.equal(reads.length, 0);
  });

  it("redirects /logout to Access's logout", async () => {
    const { get } = setup();
    const response = await get("/logout");
    assert.equal(response.status, 302);
    assert.equal(
      response.headers.get("location"),
      "https://morlocked.test/cdn-cgi/access/logout"
    );
  });
});

describe("admin routes", () => {
  it("401s every admin path without a valid token, before reading KV", async () => {
    for (const path of [
      "/api/admin",
      "/api/admin/me",
      "/api/admin/status",
      "/api/admin/nope",
    ]) {
      const { get, reads } = setup({ "meta:admin": { secret: true } });
      const response = await get(path);
      assert.equal(response.status, 401, path);
      assert.equal(response.headers.get("cache-control"), "no-store", path);
      assert.equal(reads.length, 0, path);
    }
  });

  it("401s a valid token for someone else", async () => {
    const { get } = setup({ "meta:admin": { secret: true } });
    const token = await accessToken({ email: "someone@example.com" });
    assert.equal(
      (await get("/api/admin/status", { "cf-access-jwt-assertion": token }))
        .status,
      401
    );
  });

  it("serves the admin check and meta:admin to the admin, never cached", async () => {
    const { get } = setup({ "meta:admin": { updated_at: "now" } });
    const headers = { "cf-access-jwt-assertion": await accessToken() };

    const me = await get("/api/admin/me", headers);
    assert.equal(me.status, 200);
    assert.deepEqual(await me.json(), { admin: true, email: ADMIN_EMAIL });
    assert.equal(me.headers.get("cache-control"), "no-store");

    const status = await get("/api/admin/status", headers);
    assert.equal(status.status, 200);
    assert.deepEqual(await status.json(), { updated_at: "now" });
    assert.equal(status.headers.get("cache-control"), "no-store");

    assert.equal((await get("/api/admin/nope", headers)).status, 404);
  });
});
