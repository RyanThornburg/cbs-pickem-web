import { CSSProperties, MouseEvent, ReactNode } from "react";
import { Link as RouterLink } from "react-router-dom";
import styles from "./PlainLink.module.css";

export interface PlainLinkStyle {
  // Converted callers style it with a class from their own CSS module.
  className?: string;
  style?: CSSProperties;
}

// A row behind the link may have its own click; the link wins. A plain
// click opens the page at its top, like a tab change; a modified click opens
// a browser tab and leaves this one alone.
const onClick = (event: MouseEvent) => {
  event.stopPropagation();
  if (!event.metaKey && !event.ctrlKey && !event.shiftKey) {
    window.scrollTo({ top: 0 });
  }
};

// An in-app link that looks like the text it wraps until it's hovered or
// focused: team marks and player names, so cards and tables full of them
// don't turn into rows of blue links.
export const PlainLink = ({
  to,
  children,
  label,
  className,
  style,
}: PlainLinkStyle & {
  to: string;
  children: ReactNode;
  label?: string;
}) => (
  <RouterLink
    to={to}
    aria-label={label}
    onClick={onClick}
    className={[styles.link, className].filter(Boolean).join(" ")}
    style={style}
  >
    {children}
  </RouterLink>
);
