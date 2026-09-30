export const fetchJson = async <T>(path: string): Promise<T> => {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`${path} responded with ${response.status}`);
  }
  return (await response.json()) as T;
};

// Runs `tick` immediately, then every `intervalMs`, until the returned cleanup is
// called. Most callers want `pollAsync`/`pollJson` below, which also drop
// results that land after cleanup.
export const poll = (tick: () => void, intervalMs: number): (() => void) => {
  tick();
  const intervalId = setInterval(tick, intervalMs);
  return () => clearInterval(intervalId);
};

// Polls `load` (one fetch, or several joined), handing each result to
// `onData`. Nothing is delivered after the returned cleanup runs, so a slow
// response for a week the user already left can't overwrite the new one.
export const pollAsync = <T>(
  load: () => Promise<T>,
  intervalMs: number,
  onData: (data: T) => void,
  onError?: (error: Error) => void
): (() => void) => {
  let cancelled = false;

  const stop = poll(() => {
    load()
      .then((data) => {
        if (!cancelled) {
          onData(data);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          onError?.(error instanceof Error ? error : new Error(String(error)));
        }
      });
  }, intervalMs);

  return () => {
    cancelled = true;
    stop();
  };
};

export const pollJson = <T>(
  path: string,
  intervalMs: number,
  onData: (data: T) => void,
  onError?: (error: Error) => void
): (() => void) => pollAsync(() => fetchJson<T>(path), intervalMs, onData, onError);
