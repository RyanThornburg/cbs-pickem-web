export const fetchJson = async <T>(path: string): Promise<T> => {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`${path} responded with ${response.status}`);
  }
  return (await response.json()) as T;
};

// Runs `tick` immediately, then every `intervalMs`, until the returned cleanup is
// called. Callers that need more than one fetch per tick (e.g. joining two endpoints)
// use this directly; single-endpoint pollers should use `pollJson` below instead.
export const poll = (tick: () => void, intervalMs: number): (() => void) => {
  tick();
  const intervalId = setInterval(tick, intervalMs);
  return () => clearInterval(intervalId);
};

export const pollJson = <T>(
  path: string,
  intervalMs: number,
  onData: (data: T) => void,
  onError?: (error: Error) => void
): (() => void) => {
  let cancelled = false;

  const stop = poll(() => {
    fetchJson<T>(path)
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
