import { Popover } from "@base-ui/react/popover";
import {
  FocusEvent,
  MouseEvent,
  ReactElement,
  ReactNode,
  useState,
} from "react";
import styles from "./Tooltip.module.css";

// What MUI's Tooltip waited before opening on hover.
const HOVER_DELAY_MS = 100;
// MUI drew a tooltip 14px off its trigger, arrow or not (the arrow sits
// inside that gap).
const GAP_PX = 14;

// A short explanation that opens on hover, on keyboard focus, and on a tap
// (MUI's only opened on a long press, which is why BadgeTooltip existed).
// Built on Base UI's Popover rather than its Tooltip, which by design never
// opens on touch. Focus stays on the trigger, a tap elsewhere or Escape
// closes it, and the trigger keeps its own role, label and tab stop: give
// it an aria-label carrying the same meaning so screen readers don't need
// the popup. `stopPropagation` keeps a tap from also reaching a clickable
// row behind the trigger.
export function Tooltip({
  title,
  children,
  side = "bottom",
  arrow = false,
  tone = "dark",
  stopPropagation = false,
  open: controlledOpen,
  onOpenChange,
  popupClassName,
}: {
  title: ReactNode;
  // The trigger: one element that can take a ref and event handlers.
  children: ReactElement;
  side?: "top" | "bottom";
  arrow?: boolean;
  tone?: "dark" | "light";
  stopPropagation?: boolean;
  // Optional control from outside (the pick-split list opens on click too).
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  popupClassName?: string;
}) {
  const [ownOpen, setOwnOpen] = useState(false);
  const open = controlledOpen ?? ownOpen;
  const setOpen = (next: boolean) => {
    setOwnOpen(next);
    onOpenChange?.(next);
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        render={children}
        nativeButton={false}
        openOnHover
        delay={HOVER_DELAY_MS}
        onFocus={(event: FocusEvent<HTMLElement>) => {
          // Keyboard focus only, like MUI: a click focuses too, and opens
          // the popover on its own.
          if (event.currentTarget.matches(":focus-visible")) setOpen(true);
        }}
        onBlur={() => setOpen(false)}
        onClick={(event: MouseEvent) => {
          if (stopPropagation) event.stopPropagation();
        }}
      />
      <Popover.Portal>
        <Popover.Positioner
          side={side}
          sideOffset={GAP_PX}
          collisionPadding={8}
          className={styles.positioner}
        >
          <Popover.Popup
            initialFocus={false}
            finalFocus={false}
            role="tooltip"
            className={[styles.popup, styles[tone], popupClassName]
              .filter(Boolean)
              .join(" ")}
          >
            {title}
            {arrow && <Popover.Arrow className={styles.arrow} />}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
