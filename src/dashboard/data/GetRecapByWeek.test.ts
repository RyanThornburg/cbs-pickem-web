import { WeekRecap } from "../types";
import { GetRecapByWeek, RECAP_VERSION } from "./GetRecapByWeek";

// Serves one response for the recap route and resolves with the callback's value.
const load = (
  status: number,
  body: unknown
): Promise<{ recap: WeekRecap | undefined; path: string }> => {
  let path = "";
  global.fetch = vi.fn((p: string) => {
    path = p;
    return Promise.resolve({
      ok: status < 400,
      status,
      json: () => Promise.resolve(body),
    });
  }) as unknown as typeof fetch;

  return new Promise((resolve) => {
    const stop = GetRecapByWeek(2026, 3, (recap) => {
      stop?.();
      resolve({ recap, path });
    });
  });
};

describe("GetRecapByWeek", () => {
  const realFetch = global.fetch;
  const realWarn = console.warn;
  beforeEach(() => {
    console.warn = vi.fn();
  });
  afterEach(() => {
    global.fetch = realFetch;
    console.warn = realWarn;
  });

  it("reads the week's recap key when it's the version this UI was written for", async () => {
    const body = { version: RECAP_VERSION, week: 3, items: [] };
    const { recap, path } = await load(200, body);
    expect(path).toBe("/api/weeks/2026/3/recap");
    expect(recap).toEqual(body);
  });

  it("treats any other version, or none, as no data", async () => {
    expect(
      (await load(200, { version: RECAP_VERSION + 1, items: [] })).recap
    ).toBeUndefined();
    expect(
      (await load(200, { version: RECAP_VERSION - 1, tidbits: [] })).recap
    ).toBeUndefined();
    expect((await load(200, { items: [] })).recap).toBeUndefined();
    expect(console.warn).toHaveBeenCalledTimes(3);
  });

  it("treats a missing key as no data", async () => {
    expect((await load(404, { error: "not_found" })).recap).toBeUndefined();
  });

  it("reports no data without fetching before season and week are known", () => {
    global.fetch = vi.fn() as unknown as typeof fetch;
    const callback = vi.fn();
    GetRecapByWeek(2026, 0, callback);
    expect(callback).toHaveBeenCalledWith(undefined);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
