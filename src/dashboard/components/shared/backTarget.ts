import { useLayoutEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

// Where each in-app history entry came from, so a team or player page's
// back link can name the page it actually returns to ("← Trends", not a
// fixed "← Standings"). Kept in memory, keyed by the router's location key;
// a reload starts empty and the back link falls back to its fixed page.
export interface BackTarget {
  label: string;
}
const backTargets = new Map<string, BackTarget>();
// The entry shown last. Module-level, not a ref, so it survives MainGrid
// remounting when the route pattern changes.
let previousKey: string | null = null;

const SITE_SUFFIX = " · Morlocked Pick'em";

// Called once, high in the tree (MainGrid). A layout effect runs before
// any page's useEffect sets the new title, so document.title is still the
// page being left.
export function useTrackBackTargets() {
  const location = useLocation();
  const navigationType = useNavigationType();

  useLayoutEffect(() => {
    const from = previousKey;
    previousKey = location.key;
    if (from === null || from === location.key) return;
    if (navigationType === "POP") return; // back/forward: already recorded
    if (navigationType === "REPLACE") {
      // Same history slot, so it returns where the replaced entry did.
      const inherited = backTargets.get(from);
      if (inherited) backTargets.set(location.key, inherited);
      else backTargets.delete(location.key);
      return;
    }
    const title = document.title;
    const label = title.endsWith(SITE_SUFFIX)
      ? title.slice(0, -SITE_SUFFIX.length)
      : "";
    if (label) backTargets.set(location.key, { label });
  }, [location.key, navigationType]);
}

export const backTargetFor = (key: string) => backTargets.get(key);
