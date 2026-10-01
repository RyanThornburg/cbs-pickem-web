import dayjs from "dayjs";

// Short weekday + time on one line -- for layouts tight on column width
// (e.g. GamesCard's Kickoff column) where the full "ddd, MMM DD" date
// wraps onto a second line and throws off row alignment.
// "Time TBD" rather than dayjs's "Invalid Date" when the feed's kickoff
// doesn't parse (e.g. a flexed game whose time isn't set yet).
export const formatGameShort = (gameStart: number): string => {
  const day = dayjs(gameStart);
  return day.isValid() ? day.format("ddd h:mm A") : "Time TBD";
};
