import Box from "@mui/material/Box";
import { SxProps, Theme } from "@mui/material/styles";
import { CSSProperties, MouseEvent, ReactNode } from "react";
import { Link as RouterLink } from "react-router-dom";
import { focusRingColor } from "../../shared-theme/themePrimitives";
import styles from "./PlainLink.module.css";

export interface PlainLinkStyle {
  // Converted callers style it with a class from their own CSS module.
  className?: string;
  style?: CSSProperties;
  // Callers still on MUI. Goes once the last one is converted (see
  // docs/mui-migration.md); with `sx` the link renders through MUI's Box.
  sx?: SxProps<Theme>;
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
  sx,
}: PlainLinkStyle & {
  to: string;
  children: ReactNode;
  label?: string;
}) =>
  sx ? (
    <Box
      component={RouterLink}
      to={to}
      aria-label={label}
      onClick={onClick}
      className={className}
      style={style}
      sx={[
        {
          display: "inline-flex",
          alignItems: "center",
          minWidth: 0,
          color: "inherit",
          textDecoration: "none",
          borderRadius: 1,
          "&:hover": {
            textDecoration: "underline",
            textUnderlineOffset: "3px",
            textDecorationColor: "rgba(0, 0, 0, 0.4)",
          },
          "&:focus-visible": {
            outline: `2px solid ${focusRingColor}`,
            outlineOffset: 2,
          },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {children}
    </Box>
  ) : (
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
