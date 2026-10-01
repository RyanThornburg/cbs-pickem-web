import { ReactNode, useRef, useState } from "react";
import Box from "@mui/material/Box";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import Tooltip from "@mui/material/Tooltip";
import { brand } from "../../shared-theme/themePrimitives";

// The small marks next to names and in the Week column. Each explains
// itself on hover, on keyboard focus, or on a tap (no long-press), and is
// announced by its full meaning. A tap doesn't also open the row.
// Controlled, because MUI 9's own touch handling only opens a tooltip on a
// disabled trigger: a tap (a click) opens it, a tap elsewhere closes it.
// The mouseleave a browser fakes right after a tap is ignored, or the
// tooltip would close as it opens.
// `plain` draws the mark alone, with no tooltip or focus stop, for the
// badge key.
export function BadgeTooltip({
  title,
  plain = false,
  children,
}: {
  title: string;
  plain?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const tapped = useRef(false);
  const close = () => {
    tapped.current = false;
    setOpen(false);
  };
  if (plain) {
    return (
      <Box component="span" aria-hidden sx={{ display: "inline-flex" }}>
        {children}
      </Box>
    );
  }
  return (
    // Only listening while open: there's one of these per badge.
    <ClickAwayListener
      onClickAway={close}
      mouseEvent={open ? "onClick" : false}
      touchEvent={open ? "onTouchEnd" : false}
    >
      <Tooltip
        title={title}
        open={open}
        onOpen={() => setOpen(true)}
        onClose={(event) => {
          if (tapped.current && event.type === "mouseleave") return;
          close();
        }}
        disableTouchListener
        describeChild={false}
      >
        <Box
          component="span"
          role="img"
          tabIndex={0}
          aria-label={title}
          onTouchStart={() => {
            tapped.current = true;
          }}
          onClick={(event) => {
            event.stopPropagation();
            setOpen(true);
          }}
          sx={{
            display: "inline-flex",
            flexShrink: 0,
            borderRadius: "999px",
            cursor: "help",
            "&:focus-visible": {
              outline: `3px solid ${brand[500]}`,
              outlineOffset: "2px",
            },
          }}
        >
          {children}
        </Box>
      </Tooltip>
    </ClickAwayListener>
  );
}
