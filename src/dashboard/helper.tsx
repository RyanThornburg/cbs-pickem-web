import { SxProps } from "@mui/material";
import { blue, green, orange, red } from "@mui/material/colors";
import dayjs from "dayjs";

export const gameDate = (gameStart: number) => {
  const game = dayjs(gameStart);
  return game.format("ddd, MMM DD");
};

export const gameTime = (gameStart: number) => {
  const game = dayjs(gameStart);
  return game.format("hh:mm A");
};

export const IsGameToday = (gameStart: number): boolean => {
  var now = dayjs().format("ddd, MMM DD");
  var gameTime = gameDate(gameStart);
  return now === gameTime;
};

export function stringToColor(string: string) {
  let hash = 0;
  let i;

  /* eslint-disable no-bitwise */
  for (i = 0; i < string.length; i += 1) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = "#";

  for (i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }
  /* eslint-enable no-bitwise */

  return color;
}

export function stringAvatar(name: string, props: SxProps) {
  return {
    sx: {
      ...props,
      bgcolor: stringToColor(name),
    },
    children: `${name.split(" ")[0][0]}${name.split(" ")[1][0]}`.toUpperCase(),
  };
}

export const StatusColor = {
  CORRECT: {
    bgColor: green[50],
    bgBack: green[800],
    borderColor: green[400],
    borderInProgressColor: green["A400"],
  },
  INCORRECT: {
    bgColor: red[100],
    bgBack: red[800],
    borderColor: red[400],
    borderInProgressColor: red["A400"],
  },
  MISSING: {
    bgColor: orange[100],
    bgBack: orange[800],
    borderColor: orange[400],
    borderInProgressColor: orange["A400"],
  },
  TBD: {
    bgColor: blue[50],
    bgBack: blue[800],
    borderColor: blue[400],
    borderInProgressColor: blue["A400"],
  },
  NONE: {
    bgColor: blue[50],
    bgBack: blue[800],
    borderColor: blue[400],
    borderInProgressColor: blue["A400"],
  },
};
