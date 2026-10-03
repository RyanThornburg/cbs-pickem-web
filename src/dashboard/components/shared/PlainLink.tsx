import Box from "@mui/material/Box";
import { SxProps, Theme } from "@mui/material/styles";
import { ReactNode } from "react";
import { Link as RouterLink } from "react-router-dom";
import { focusRingColor } from "../../shared-theme/themePrimitives";

// An in-app link that looks like the text it wraps until it's hovered or
// focused: team marks and player names, so cards and tables full of them
// don't turn into rows of blue links.
export const PlainLink = ({
  to,
  children,
  sx,
  label,
}: {
  to: string;
  children: ReactNode;
  sx?: SxProps<Theme>;
  label?: string;
}) => (
  <Box
    component={RouterLink}
    to={to}
    aria-label={label}
    onClick={(event: React.MouseEvent) => {
      // A row behind the link may have its own click; the link wins. A
      // plain click opens the page at its top, like a tab change; a
      // modified click opens a browser tab and leaves this one alone.
      event.stopPropagation();
      if (!event.metaKey && !event.ctrlKey && !event.shiftKey) {
        window.scrollTo({ top: 0 });
      }
    }}
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
);
