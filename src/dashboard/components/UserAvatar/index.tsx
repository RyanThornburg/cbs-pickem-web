import { CSSProperties, useState } from "react";
import { UserAvatarProps } from "./UserAvatar.types";
import { createAvatarProps } from "./UserAvatar.util";
import { ordinal } from "../../helper";
import { Icon } from "../../ui/Icon";
import styles from "./UserAvatar.module.css";

type Size = NonNullable<UserAvatarProps["size"]>;

const px = (value: number | string) =>
  typeof value === "number" ? `${value}px` : value;

// A plain value inline, or a per-breakpoint one as custom properties
// (`--{name}-xs`, …) for UserAvatar.module.css's responsive classes.
const sized = (
  value: Size,
  name: string,
  responsive: string,
  inline: (value: string) => CSSProperties
): { className?: string; style: CSSProperties } =>
  typeof value === "object"
    ? {
        className: responsive,
        style: Object.fromEntries(
          Object.entries(value).map(([bp, v]) => [`--${name}-${bp}`, px(v)])
        ),
      }
    : { style: inline(px(value)) };

export const UserAvatar = ({
  userName,
  size = 20,
  fontSize = "0.75rem",
  place = 0,
  userId,
  includeName = true,
  className,
  style,
}: UserAvatarProps) => {
  const name = sized(fontSize, "size", styles.responsive, (value) => ({
    fontSize: value,
  }));
  const nameClass = [styles.text, name.className].filter(Boolean).join(" ");
  const box = sized(size, "avatar", styles.avatarResponsive, (value) => ({
    width: value,
    height: value,
  }));
  const { src, alt } = createAvatarProps(userId, userName ?? "");
  // MUI Avatar's fallback if the image ever fails: the name's first letter,
  // or a person icon without one.
  const [failedSrc, setFailedSrc] = useState<string>();
  const failed = failedSrc === src;

  return (
    <div className={styles.row}>
      <span
        className={[
          styles.avatar,
          box.className,
          failed && styles.fallback,
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        style={{ ...box.style, ...style }}
      >
        {!failed ? (
          <img
            src={src}
            alt={alt}
            className={styles.img}
            onError={() => setFailedSrc(src)}
          />
        ) : alt ? (
          alt[0]
        ) : (
          <Icon name="Person" className={styles.fallbackIcon} />
        )}
      </span>
      {includeName && (
        <div className={styles.nameRow}>
          <span className={nameClass} style={name.style}>
            {userName}
          </span>
          {place > 0 && (
            <span className={`${nameClass} ${styles.place}`} style={name.style}>
              {ordinal(place)}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default UserAvatar;
