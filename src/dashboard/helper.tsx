import { blue, green, orange, red } from "@mui/material/colors";

interface StatusColorType {
  bgColor: string;
  bgBack: string;
  borderColor: string;
  borderInProgressColor: string;
}

interface StatusColorMap {
  CORRECT: StatusColorType;
  INCORRECT: StatusColorType;
  MISSING: StatusColorType;
  TBD: StatusColorType;
  NONE: StatusColorType;
}

export const StatusColor: StatusColorMap = {
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
} as const;

export function getOrdinal(n: number) {
  let ord = "th";

  if (n % 10 === 1 && n % 100 !== 11) {
    ord = "st";
  } else if (n % 10 === 2 && n % 100 !== 12) {
    ord = "nd";
  } else if (n % 10 === 3 && n % 100 !== 13) {
    ord = "rd";
  }

  return ord;
}

export function stringOrdinalPlace(place: number): string {
  return `${place}${getOrdinal(place)}`;
}
