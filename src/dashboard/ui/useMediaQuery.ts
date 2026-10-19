import { useCallback, useSyncExternalStore } from "react";

// MUI's breakpoints as media queries: sm 600px, md 900px. down() stops just
// short of the next breakpoint, as MUI's did.
export const UP_SM = "(min-width: 600px)";
export const DOWN_SM = "(max-width: 599.95px)";
export const UP_MD = "(min-width: 900px)";
export const DOWN_MD = "(max-width: 899.95px)";

// Whether a media query matches now, updating as it changes (MUI's
// useMediaQuery without the theme). Read on the first render, so a phone
// never renders the desktop layout first.
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query]
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false
  );
}
