import dayjs from "dayjs";

export const formatGameDate = (gameStart: number): string => {
  return dayjs(gameStart).format("ddd, MMM DD");
};

export const formatGameTime = (gameStart: number): string => {
  return dayjs(gameStart).format("hh:mm A");
};

// Short weekday + time on one line -- for layouts tight on column width
// (e.g. GamesCard's Kickoff column) where the full "ddd, MMM DD" date
// wraps onto a second line and throws off row alignment.
export const formatGameShort = (gameStart: number): string => {
  return dayjs(gameStart).format("ddd h:mm A");
};

export const isGameToday = (gameStart: number): boolean => {
  const now = dayjs().format("ddd, MMM DD");
  const gameTime = formatGameDate(gameStart);
  return now === gameTime;
};
