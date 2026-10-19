import { ComponentPropsWithoutRef, ReactNode, forwardRef } from "react";
import styles from "./IconButton.module.css";

type Common = {
  // Required: an icon-only button needs a spoken name.
  "aria-label": string;
  size?: "small" | "medium";
  className?: string;
  children: ReactNode;
};

// The theme's square icon button. With `href` it's a link that looks the
// same, as MUI's IconButton with href was. Forwards its ref, so it can be a
// Popover trigger.
export const IconButton = forwardRef<
  HTMLButtonElement & HTMLAnchorElement,
  Common &
    (
      | (Omit<ComponentPropsWithoutRef<"button">, keyof Common> & {
          href?: never;
        })
      | (Omit<ComponentPropsWithoutRef<"a">, keyof Common> & { href: string })
    )
>(function IconButton({ size = "medium", className, children, ...rest }, ref) {
  const classes = [styles.button, size === "small" && styles.small, className]
    .filter(Boolean)
    .join(" ");
  if (rest.href !== undefined) {
    return (
      <a
        ref={ref}
        {...(rest as ComponentPropsWithoutRef<"a">)}
        className={classes}
      >
        {children}
      </a>
    );
  }
  const { type = "button", ...button } =
    rest as ComponentPropsWithoutRef<"button">;
  return (
    <button ref={ref} {...button} type={type} className={classes}>
      {children}
    </button>
  );
});
