import { SxProps } from "@mui/material";
import { UserStringProps } from "./UserAvatar.types";

export const stringToColor = (str: string): string => {
  if (!str) return "#000000";

  let hash = 0;

  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash; // Convert to 32-bit integer
  }

  const color =
    "#" +
    Array.from({ length: 3 })
      .map((_, i) => {
        const value = (hash >> (i * 8)) & 0xff;
        return `00${value.toString(16)}`.slice(-2);
      })
      .join("");

  return color;
};

export const getInitials = (name: string): string => {
  const nameParts = name.split(" ");
  return nameParts.length >= 2
    ? `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
    : nameParts[0][0].toUpperCase();
};

export const createAvatarProps = (
  name: string,
  props: SxProps
): UserStringProps => {
  const initials = getInitials(name);
  return {
    sx: {
      ...props,
      bgcolor: stringToColor(name),
      lineHeight: 1,
      // Two-letter initials sit closer to the edge of the circle than one
      // letter does, so tighten letter-spacing to keep them off the border.
      letterSpacing: initials.length > 1 ? "-0.05em" : "normal",
    },
    children: initials,
  };
};
