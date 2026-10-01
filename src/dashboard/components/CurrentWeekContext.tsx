import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { fetchJson } from "../../api/pickemApi";

const META_POLL_INTERVAL_MS = 5 * 60_000;
// Until the first meta arrives the app has nothing to show, so a failed
// first load retries much sooner than the regular poll.
export const META_RETRY_INTERVAL_MS = 15_000;
const DEFAULT_SECOND_HALF_START_WEEK = 10;
// How many places pay out, from meta:current's paid_places (set on the data
// side). Drives how many rows the second-half leader cards show.
export interface PaidPlaces {
  overall: number;
  first_half: number;
  second_half: number;
}
const DEFAULT_PAID_PLACES: PaidPlaces = {
  overall: 5,
  first_half: 3,
  second_half: 3,
};

interface ApiMeta {
  season: number;
  current_week: number;
  second_half_start_week: number;
  cbs_pool_url?: string | null;
  paid_places?: Partial<PaidPlaces> | null;
}

// "loading" until the first meta arrives, "failed" while that first load
// keeps failing. Once loaded it stays "ready": a later failed poll keeps the
// last good meta, which changes about once a week.
export type MetaStatus = "loading" | "ready" | "failed";

type CurrentWeekContextType = {
  metaStatus: MetaStatus;
  // Load meta now instead of waiting for the next retry.
  retryMeta: () => void;
  currentWeek: number;
  setCurrentWeek: React.Dispatch<React.SetStateAction<number>>;
  season: number;
  secondHalfStartWeek: number;
  isSecondHalf: boolean;
  cbsPoolUrl: string | null;
  paidPlaces: PaidPlaces;
};

const CurrentWeekContext = createContext<CurrentWeekContextType | undefined>(
  undefined
);

export const CurrentWeekProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentWeek, setCurrentWeek] = useState<number>(0);
  const [season, setSeason] = useState<number>(0);
  const [secondHalfStartWeek, setSecondHalfStartWeek] = useState<number>(
    DEFAULT_SECOND_HALF_START_WEEK
  );
  const [cbsPoolUrl, setCbsPoolUrl] = useState<string | null>(null);
  const [paidPlaces, setPaidPlaces] = useState<PaidPlaces>(DEFAULT_PAID_PLACES);
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
      setSecondHalfStartWeek(meta.second_half_start_week);
      setCbsPoolUrl(meta.cbs_pool_url ?? null);
      setPaidPlaces({
        overall: meta.paid_places?.overall ?? DEFAULT_PAID_PLACES.overall,
        first_half:
          meta.paid_places?.first_half ?? DEFAULT_PAID_PLACES.first_half,
        second_half:
          meta.paid_places?.second_half ?? DEFAULT_PAID_PLACES.second_half,
      });
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

  const isSecondHalf = currentWeek >= secondHalfStartWeek;
  return (
    <CurrentWeekContext.Provider
      value={{
        metaStatus,
        retryMeta,
        currentWeek,
        setCurrentWeek,
        season,
        secondHalfStartWeek,
        isSecondHalf,
        cbsPoolUrl,
        paidPlaces,
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
