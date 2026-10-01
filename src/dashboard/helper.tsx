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

// 1 -> "1st", 12 -> "12th", 22 -> "22nd".
export const ordinal = (n: number): string => {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  const suffix = ["th", "st", "nd", "rd"][n % 10] ?? "th";
  return `${n}${suffix}`;
};

// Read by screen readers, not shown.
export const visuallyHidden = {
  position: "absolute",
  width: "1px",
  height: "1px",
  margin: "-1px",
  padding: 0,
  border: 0,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
} as const;
