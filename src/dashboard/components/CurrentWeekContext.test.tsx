import { act, render, screen } from "@testing-library/react";
import {
  CurrentWeekProvider,
  META_RETRY_INTERVAL_MS,
  useCurrentWeek,
} from "./CurrentWeekContext";

const META = { season: 2026, current_week: 4, second_half_start_week: 10 };

// Each call to fetch takes the next response: a status, or "hang" for a
// request that never settles.
const serve = (...responses: (number | "hang")[]) => {
  const fetchMock = vi.fn(() => {
    const next = responses.shift() ?? 200;
    if (next === "hang") return new Promise(() => {});
    return Promise.resolve({
      ok: next < 400,
      status: next,
      json: () => Promise.resolve(META),
    });
  });
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
};

let retry: () => void = () => {};
function Probe() {
  const { metaStatus, currentWeek, retryMeta } = useCurrentWeek();
  retry = retryMeta;
  return <span data-testid="meta">{`${metaStatus} ${currentWeek}`}</span>;
}

// Lets the fetch promise chain settle under fake timers.
const flush = () => act(() => vi.advanceTimersByTimeAsync(0));

describe("CurrentWeekProvider", () => {
  const realFetch = global.fetch;
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    global.fetch = realFetch;
  });

  const mount = () =>
    render(
      <CurrentWeekProvider>
        <Probe />
      </CurrentWeekProvider>
    );
  const status = () => screen.getByTestId("meta").textContent;

  it("is loading until the first meta arrives, then ready", async () => {
    serve(200);
    mount();
    expect(status()).toBe("loading 0");
    await flush();
    expect(status()).toBe("ready 4");
  });

  it("fails a first load, retries on the short interval, and recovers", async () => {
    const fetchMock = serve(500, 200);
    mount();
    await flush();
    expect(status()).toBe("failed 0");
    await act(() => vi.advanceTimersByTimeAsync(META_RETRY_INTERVAL_MS));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(status()).toBe("ready 4");
  });

  it("keeps the last good meta when a later poll fails", async () => {
    const fetchMock = serve(200, 500);
    mount();
    await flush();
    // No early retry once loaded: the next load is the regular poll.
    await act(() => vi.advanceTimersByTimeAsync(META_RETRY_INTERVAL_MS));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await act(() => vi.advanceTimersByTimeAsync(5 * 60_000));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(status()).toBe("ready 4");
  });

  it("retries right away on request, without stacking a second timer", async () => {
    const fetchMock = serve(500, "hang");
    mount();
    await flush();
    expect(status()).toBe("failed 0");
    act(() => retry());
    expect(status()).toBe("loading 0");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    // The hung request owns the schedule now; nothing else fires meanwhile.
    await act(() => vi.advanceTimersByTimeAsync(META_RETRY_INTERVAL_MS * 3));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
