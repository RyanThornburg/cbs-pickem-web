import { useCallback, useLayoutEffect, useRef } from "react";

// A callback whose identity never changes but always runs the latest `fn`.
// MainGrid hands these to the memoized tabs, so a re-render up there (a tab
// switch, a poll) doesn't re-render a hidden tab just because a handler that
// closes over the router or the browsed week was recreated.
export function useStableHandler<A extends unknown[], R>(
  fn: (...args: A) => R
): (...args: A) => R {
  const ref = useRef(fn);
  useLayoutEffect(() => {
    ref.current = fn;
  });
  return useCallback((...args: A) => ref.current(...args), []);
}
