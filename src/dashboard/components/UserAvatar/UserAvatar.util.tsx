import { SxProps, Theme } from "@mui/material";
import { minidenticon } from "minidenticons";
import { UserStringProps } from "./UserAvatar.types";

// Deterministic per-user pattern instead of initials -- initials alone
// collide constantly at this pool's size (e.g. "Patrick Madden" and
// "Patrick McCarthy" both read "PM"). Seeded on userId rather than name so
// it's stable across a display-name change and immune to two users sharing
// an identical name, which initials couldn't tell apart either.
const identiconDataUri = (userId: string): string =>
  "data:image/svg+xml;utf8," + encodeURIComponent(minidenticon(userId, 60, 45));

export const createAvatarProps = (
  userId: string,
  name: string,
  props: SxProps
): UserStringProps => ({
  src: identiconDataUri(userId),
  alt: name,
  // minidenticon's "off" cells are transparent, not a painted background --
  // give the avatar itself a subtle neutral tile so the pattern reads
  // against something in both themes.
  sx: (theme: Theme) => ({
    ...(props as object),
    bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
  }),
});
