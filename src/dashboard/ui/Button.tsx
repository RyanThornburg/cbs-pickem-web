import { ComponentPropsWithoutRef, ReactNode } from "react";
import styles from "./Button.module.css";

type Common = {
  variant?: "text" | "outlined" | "contained";
  size?: "small" | "medium";
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  className?: string;
  children: ReactNode;
};

type AsButton = Common &
  Omit<ComponentPropsWithoutRef<"button">, keyof Common> & { href?: never };
type AsLink = Common &
  Omit<ComponentPropsWithoutRef<"a">, keyof Common> & {
    href: string;
    disabled?: boolean;
  };

// The app's button without MUI: text (default), outlined or contained, 40px
// or 36px (small). With `href` it's a link that looks like the button, as
// MUI's Button with href was.
export function Button(props: AsButton | AsLink) {
  const {
    variant = "text",
    size = "medium",
    startIcon,
    endIcon,
    className,
    children,
    ...rest
  } = props;
  const classes = [
    styles.button,
    styles[variant],
    size === "small" && styles.small,
    className,
  ];
  const content = (
    <>
      {startIcon && <span className={styles.start}>{startIcon}</span>}
      {children}
      {endIcon && <span className={styles.end}>{endIcon}</span>}
    </>
  );

  if (rest.href !== undefined) {
    const { disabled, ...link } = rest as AsLink;
    return (
      <a
        {...link}
        className={classes
          .concat(disabled && styles.disabled)
          .filter(Boolean)
          .join(" ")}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : link.tabIndex}
      >
        {content}
      </a>
    );
  }
  const { type = "button", ...button } = rest as AsButton;
  return (
    <button
      {...button}
      type={type}
      className={classes.filter(Boolean).join(" ")}
    >
      {content}
    </button>
  );
}
