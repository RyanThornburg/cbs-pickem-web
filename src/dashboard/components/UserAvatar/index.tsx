import { Avatar } from "@mui/material";
import { CSSProperties } from "react";
import { UserAvatarProps } from "./UserAvatar.types";
import { createAvatarProps } from "./UserAvatar.util";
import { ordinal } from "../../helper";
import styles from "./UserAvatar.module.css";

const px = (value: number | string) =>
  typeof value === "number" ? `${value}px` : value;

// The name's font size: a plain value inline, or a per-breakpoint one as
// custom properties for UserAvatar.module.css's .responsive.
const nameSize = (
  fontSize: NonNullable<UserAvatarProps["fontSize"]>
): { className: string; style: CSSProperties } =>
  typeof fontSize === "object"
    ? {
        className: `${styles.text} ${styles.responsive}`,
        style: Object.fromEntries(
          Object.entries(fontSize).map(([bp, value]) => [
            `--size-${bp}`,
            px(value),
          ])
        ),
      }
    : { className: styles.text, style: { fontSize: px(fontSize) } };

export const UserAvatar = ({
  userName,
  size = 20,
  fontSize = "0.75rem",
  place = 0,
  userId,
  includeName = true,
  ...props
}: UserAvatarProps) => {
  const name = nameSize(fontSize);
  return (
    <div className={styles.row}>
      <Avatar
        {...createAvatarProps(userId, userName ?? "", {
          width: size,
          height: size,
        })}
        {...props}
      />
      {includeName && (
        <div className={styles.nameRow}>
          <span className={name.className} style={name.style}>
            {userName}
          </span>
          {place > 0 && (
            <span
              className={`${name.className} ${styles.place}`}
              style={name.style}
            >
              {ordinal(place)}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default UserAvatar;
