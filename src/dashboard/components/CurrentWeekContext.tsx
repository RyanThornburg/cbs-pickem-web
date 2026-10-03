import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { fetchJson } from "../../api/pickemApi";
import { PayPeriod } from "../types";

const META_POLL_INTERVAL_MS = 5 * 60_000;
// Until the first meta arrives the app has nothing to show, so a failed
// first load retries much sooner than the regular poll.
export const META_RETRY_INTERVAL_MS = 15_000;
interface ApiMeta {
  season: number;
  current_week: number;
  // The season's prize periods (overall first), set on the data side.
  periods?: PayPeriod[] | null;
  cbs_pool_url?: string | null;
}

// "loading" until the first meta arrives, "failed" while that first load
// keeps failing. Once loaded it stays "ready": a later failed poll keeps the
// last good meta, which changes about once a week.
export type MetaStatus = "loading" | "ready" | "failed";

const CBS_POOL_URL_KEY = "cbsPoolUrl";
const readCbsPoolUrl = (): string | null => {
  try {
    return localStorage.getItem(CBS_POOL_URL_KEY);
  } catch {
    return null;
  }
};

type CurrentWeekContextType = {
  metaStatus: MetaStatus;
  // Load meta now instead of waiting for the next retry.
  retryMeta: () => void;
  currentWeek: number;
  setCurrentWeek: React.Dispatch<React.SetStateAction<number>>;
  season: number;
  // Prize periods in display order, overall first. Empty until meta loads.
  periods: PayPeriod[];
  cbsPoolUrl: string | null;
};

const CurrentWeekContext = createContext<CurrentWeekContextType | undefined>(
  undefined
);

export const CurrentWeekProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentWeek, setCurrentWeek] = useState<number>(0);
  const [season, setSeason] = useState<number>(0);
  const [periods, setPeriods] = useState<PayPeriod[]>([]);
  // Remembered from the last visit, so the CBS link still works while meta
  // can't load.
  const [cbsPoolUrl, setCbsPoolUrl] = useState<string | null>(readCbsPoolUrl);
  const [metaStatus, setMetaStatus] = useState<MetaStatus>("loading");
  // The running poll's "load now", for retryMeta.
  const loadNowRef = useRef<() => void>(() => {});

  // One timer at a time: each load schedules the next, on the regular
  // interval once meta has loaded and on the short retry until then.
  useEffect(() => {
    let cancelled = false;
    let loaded = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const applyMeta = (meta: ApiMeta) => {
      setSeason(meta.season);
      setCurrentWeek(meta.current_week);
      setPeriods(meta.periods ?? []);
      setCbsPoolUrl(meta.cbs_pool_url ?? null);
      try {
        if (meta.cbs_pool_url) {
          localStorage.setItem(CBS_POOL_URL_KEY, meta.cbs_pool_url);
        }
      } catch {
        // Blocked storage: the link just won't be there during an outage.
      }
    };

    const load = () => {
      clearTimeout(timer);
      fetchJson<ApiMeta>("/api/meta")
        .then((meta) => {
          if (cancelled) return;
          loaded = true;
          applyMeta(meta);
          setMetaStatus("ready");
        })
        .catch(() => {
          if (!cancelled && !loaded) setMetaStatus("failed");
        })
        .finally(() => {
          if (cancelled) return;
          clearTimeout(timer);
          timer = setTimeout(
            load,
            loaded ? META_POLL_INTERVAL_MS : META_RETRY_INTERVAL_MS
          );
        });
    };

    loadNowRef.current = load;
    load();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  const retryMeta = useCallback(() => {
    setMetaStatus("loading");
    loadNowRef.current();
  }, []);

  return (
    <CurrentWeekContext.Provider
      value={{
        metaStatus,
        retryMeta,
        currentWeek,
        setCurrentWeek,
        season,
        periods,
        cbsPoolUrl,
      }}
    >
      {children}
    </CurrentWeekContext.Provider>
  );
};

export const useCurrentWeek = () => {
  const context = useContext(CurrentWeekContext);
  if (context === undefined) {
    throw new Error("useCurrentWeek must be used within a WeekProvider");
  }
  return context;
};
