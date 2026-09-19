import React, { createContext, useContext, useEffect, useState } from "react";
import { pollJson } from "../../api/pickemApi";

const META_POLL_INTERVAL_MS = 5 * 60_000;
const DEFAULT_SECOND_HALF_START_WEEK = 10;

interface ApiMeta {
  season: number;
  current_week: number;
  second_half_start_week: number;
}

type CurrentWeekContextType = {
  currentWeek: number;
  setCurrentWeek: React.Dispatch<React.SetStateAction<number>>;
  season: number;
  secondHalfStartWeek: number;
  isSecondHalf: boolean;
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

  useEffect(() => {
    return pollJson<ApiMeta>("/api/meta", META_POLL_INTERVAL_MS, (meta) => {
      setSeason(meta.season);
      setCurrentWeek(meta.current_week);
      setSecondHalfStartWeek(meta.second_half_start_week);
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
