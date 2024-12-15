// components/GameCard/styles.ts
import { SxProps, Theme } from "@mui/material";

export const cardStyles: SxProps<Theme> = {
  width: "100%",
  transition: "transform 0.2s ease-in-out",
  "&:hover": {
    transform: "scale(1.02)",
  },
};

export const contentStyles: SxProps<Theme> = {
  padding: (theme) => theme.spacing(2),
  "&:last-child": {
    paddingBottom: (theme) => theme.spacing(2),
  },
};
