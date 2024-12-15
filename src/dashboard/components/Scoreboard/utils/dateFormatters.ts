import dayjs from "dayjs";

export const formatGameDate = (gameStart: number): string => {
  return dayjs(gameStart).format("ddd, MMM DD");
};

export const formatGameTime = (gameStart: number): string => {
  return dayjs(gameStart).format("hh:mm A");
};

export const isGameToday = (gameStart: number): boolean => {
  const now = dayjs().format("ddd, MMM DD");
  const gameTime = formatGameDate(gameStart);
  return now === gameTime;
};
