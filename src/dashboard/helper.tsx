// A pick tile's fill and border by result (UserPickStack), in MUI's color
// palette, which the tiles have always used.
interface StatusColorType {
  bgColor: string;
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

// green[50] / [400] / A400, and the same steps of red (100 for the fill),
// orange (100) and blue (50).
export const StatusColor: StatusColorMap = {
  CORRECT: {
    bgColor: "#e8f5e9",
    borderColor: "#66bb6a",
    borderInProgressColor: "#00e676",
  },
  INCORRECT: {
    bgColor: "#ffcdd2",
    borderColor: "#ef5350",
    borderInProgressColor: "#ff1744",
  },
  MISSING: {
    bgColor: "#ffe0b2",
    borderColor: "#ffa726",
    borderInProgressColor: "#ff9100",
  },
  TBD: {
    bgColor: "#e3f2fd",
    borderColor: "#42a5f5",
    borderInProgressColor: "#2979ff",
  },
  NONE: {
    bgColor: "#e3f2fd",
    borderColor: "#42a5f5",
    borderInProgressColor: "#2979ff",
  },
} as const;

// 1 -> "1st", 12 -> "12th", 22 -> "22nd".
export const ordinal = (n: number): string => {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  const suffix = ["th", "st", "nd", "rd"][n % 10] ?? "th";
  return `${n}${suffix}`;
};
