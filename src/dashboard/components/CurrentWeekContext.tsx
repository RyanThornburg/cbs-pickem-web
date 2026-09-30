import React, { createContext, useContext, useEffect, useState } from "react";
import { pollJson } from "../../api/pickemApi";

const META_POLL_INTERVAL_MS = 5 * 60_000;
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

type CurrentWeekContextType = {
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

  useEffect(() => {
    return pollJson<ApiMeta>("/api/meta", META_POLL_INTERVAL_MS, (meta) => {
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
    });
  }, []);

  const isSecondHalf = currentWeek >= secondHalfStartWeek;
  return (
    <CurrentWeekContext.Provider
      value={{
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
