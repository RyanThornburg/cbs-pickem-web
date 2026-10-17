import { describe, it } from "vitest";
import assert from "node:assert/strict";
import worker from "./index.ts";
import { parsePayment, type RosterResponse } from "./roster.ts";
import { accessToken, testEnv } from "./testHelpers.ts";

const ORIGIN = "https://morlocked.test";

const ADMIN_USERS = {
  updated_at: "2026-10-17T17:40:06Z",
  users: [
    {
      user_id: 4,
      name: "bea Costa",
      email: "bea@example.com",
      is_active: true,
    },
    {
      user_id: 7,
      name: "Alex Rivera",
      email: "alex@example.com",
      is_active: true,
    },
    {
      user_id: 9,
      name: "Gone Guy",
      email: "gone@example.com",
      is_active: false,
    },
  ],
};

// An in-memory KV that stores JSON as text, like the real one, and records
// every put.
const setup = (initial: Record<string, unknown> = {}) => {
  const store = new Map<string, string>(
    Object.entries({
      "admin:users": ADMIN_USERS,
      "meta:current": { season: 2026, entry_fee: 200 },
      ...initial,
    }).map(([k, v]) => [k, JSON.stringify(v)])
  );
  const puts: string[] = [];
  const env = testEnv({
    PICKEM_KV: {
      get: async (key: string) => {
        const value = store.get(key);
        return value === undefined ? null : JSON.parse(value);
      },
      put: async (key: string, value: string) => {
        puts.push(key);
        store.set(key, value);
      },
    },
  });
  const call = async (
    path: string,
    init: RequestInit & { auth?: boolean } = {}
  ) => {
    const { auth = true, ...rest } = init;
    const headers = new Headers(rest.headers);
    if (auth) headers.set("cf-access-jwt-assertion", await accessToken());
    return worker.fetch(
      new Request(`${ORIGIN}${path}`, { ...rest, headers }) as Parameters<
        typeof worker.fetch
      >[0],
      env,
      {} as ExecutionContext
    );
  };
  const put = (path: string, body: unknown, headers: HeadersInit = {}) =>
    call(path, {
      method: "PUT",
      body: JSON.stringify(body),
      headers: {
        origin: ORIGIN,
        "content-type": "application/json",
        ...headers,
      },
    });
  const stored = (key: string) => {
    const value = store.get(key);
    return value === undefined ? undefined : JSON.parse(value);
  };
  return { call, put, puts, stored };
};

const PAYMENT = {
  paid_amount: 200,
  paid_at: "2026-09-02",
  method: "venmo",
  note: "",
};

describe("roster routes", () => {
  it("lists active members by name, with the fee and no payments yet", async () => {
    const { call } = setup();
    const response = await call("/api/admin/roster/2026");
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.deepEqual(await response.json(), {
      season: 2026,
      entry_fee: 200,
      users_updated_at: "2026-10-17T17:40:06Z",
      updated_at: null,
      users: [
        {
          user_id: 7,
          name: "Alex Rivera",
          email: "alex@example.com",
          payment: null,
        },
        {
          user_id: 4,
          name: "bea Costa",
          email: "bea@example.com",
          payment: null,
        },
      ],
    });
  });

  it("leaves the fee out for a season meta:current isn't about", async () => {
    const { call } = setup();
    const body = (await (
      await call("/api/admin/roster/2025")
    ).json()) as RosterResponse;
    assert.equal(body.entry_fee, null);
  });

  it("404s the roster until admin:users exists", async () => {
    const { call } = setup({ "admin:users": null });
    assert.equal((await call("/api/admin/roster/2026")).status, 404);
  });

  it("saves one payment into roster:{season}, keyed by user id as a string", async () => {
    const { put, puts, stored } = setup({
      "roster:2026": {
        season: 2026,
        updated_at: "2026-09-01T00:00:00Z",
        users: {
          "4": { paid_amount: 100, paid_at: null, method: null, note: null },
        },
      },
    });
    const response = await put("/api/admin/roster/2026/7", PAYMENT);
    assert.equal(response.status, 200);
    const body = (await response.json()) as RosterResponse;
    assert.equal(body.users[0].payment?.paid_amount, 200);
    assert.ok(body.updated_at);

    assert.deepEqual(puts, ["roster:2026"]);
    const saved = stored("roster:2026");
    assert.equal(saved.season, 2026);
    assert.deepEqual(saved.users["7"], { ...PAYMENT, note: null });
    // The other member's entry is untouched.
    assert.equal(saved.users["4"].paid_amount, 100);
  });

  it("clears a payment with DELETE", async () => {
    const { call, stored } = setup({
      "roster:2026": {
        season: 2026,
        updated_at: "x",
        users: {
          "4": { paid_amount: 200, paid_at: null, method: null, note: null },
        },
      },
    });
    const response = await call("/api/admin/roster/2026/4", {
      method: "DELETE",
      headers: { origin: ORIGIN },
    });
    assert.equal(response.status, 200);
    assert.deepEqual(stored("roster:2026").users, {});
  });

  it("refuses writes without an admin token, from another origin, or not as JSON", async () => {
    const { call, put, puts } = setup();
    const noAuth = await call("/api/admin/roster/2026/7", {
      method: "PUT",
      auth: false,
      body: JSON.stringify(PAYMENT),
      headers: { origin: ORIGIN, "content-type": "application/json" },
    });
    assert.equal(noAuth.status, 401);
    assert.equal(
      (
        await put("/api/admin/roster/2026/7", PAYMENT, {
          origin: "https://evil.test",
        })
      ).status,
      403
    );
    const noOrigin = await call("/api/admin/roster/2026/7", {
      method: "DELETE",
    });
    assert.equal(noOrigin.status, 403);
    assert.equal(
      (
        await put("/api/admin/roster/2026/7", PAYMENT, {
          "content-type": "text/plain",
        })
      ).status,
      415
    );
    assert.deepEqual(puts, []);
  });

  it("400s a bad payment and 404s someone not in admin:users, without writing", async () => {
    const { put, puts } = setup();
    const bad = await put("/api/admin/roster/2026/7", {
      ...PAYMENT,
      paid_amount: 12.5,
    });
    assert.equal(bad.status, 400);
    assert.match(
      ((await bad.json()) as { error: string }).error,
      /whole dollars/
    );
    assert.equal(
      (await put("/api/admin/roster/2026/999", PAYMENT)).status,
      404
    );
    assert.deepEqual(puts, []);
  });

  it("only answers GET on the list and PUT/DELETE on a member", async () => {
    const { call, puts } = setup();
    assert.equal(
      (
        await call("/api/admin/roster/2026", {
          method: "PUT",
          headers: { origin: ORIGIN },
        })
      ).status,
      404
    );
    assert.equal((await call("/api/admin/roster/2026/7")).status, 404);
    assert.equal((await call("/api/admin/roster/26")).status, 404);
    assert.deepEqual(puts, []);
  });
});

describe("parsePayment", () => {
  it("accepts a full payment and trims the note", () => {
    assert.deepEqual(
      parsePayment({ ...PAYMENT, method: "cash_app", note: "  rest later " }),
      {
        paid_amount: 200,
        paid_at: "2026-09-02",
        method: "cash_app",
        note: "rest later",
      }
    );
  });

  it("accepts just an amount", () => {
    assert.deepEqual(parsePayment({ paid_amount: 0 }), {
      paid_amount: 0,
      paid_at: null,
      method: null,
      note: null,
    });
  });

  it("rejects bad fields", () => {
    for (const body of [
      null,
      { paid_amount: "200" },
      { paid_amount: -1 },
      { paid_amount: 10_001 },
      { paid_amount: 200, paid_at: "9/2/2026" },
      { paid_amount: 200, paid_at: "2026-13-45" },
      { paid_amount: 200, method: "zelle" },
      { paid_amount: 200, note: 5 },
      { paid_amount: 200, note: "x".repeat(201) },
    ]) {
      assert.equal(typeof parsePayment(body), "string", JSON.stringify(body));
    }
  });
});
