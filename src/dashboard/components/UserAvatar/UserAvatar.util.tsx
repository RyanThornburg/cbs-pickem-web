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
  name: string
): UserStringProps => ({
  src: identiconDataUri(userId),
  alt: name,
});
