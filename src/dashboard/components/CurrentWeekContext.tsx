import React, { createContext, useContext, useEffect, useState } from "react";
import { RankedUser } from "../types";
import { GetUserByWeek } from "../data/GetUserByWeek";

type CurrentWeekContextType = {
  currentWeek: number;
  setCurrentWeek: React.Dispatch<React.SetStateAction<number>>;
  rankedUsers: RankedUser[];
  isSecondHalf: boolean;
};

const CurrentWeekContext = createContext<CurrentWeekContextType | undefined>(
  undefined
);

export const CurrentWeekProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentWeek, setCurrentWeek] = useState<number>(0);
  const [rankedUsers, setRankedUsers] = useState<RankedUser[]>([]);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    if (currentWeek > 0) {
      unsubscribe = GetUserByWeek(currentWeek, (users: RankedUser[]) => {
        setRankedUsers(users);
      });
    } else {
      setRankedUsers([]);
    }

    // Cleanup function to unsubscribe when component unmounts
    // or when currentWeek changes
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [currentWeek]);

  const isSecondHalf = currentWeek >= 10;
  return (
    <CurrentWeekContext.Provider
      value={{ currentWeek, setCurrentWeek, rankedUsers, isSecondHalf }}
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
