import { Popover as BasePopover } from "@base-ui/react/popover";
import { ReactElement, ReactNode } from "react";
import styles from "./Popover.module.css";

// A panel a button opens below itself (Base UI's Popover), as MUI's
// Popover did here: modal (page scroll locked, focus moved into the panel
// and back to the button on close), closed by a tap outside or Escape, and
// slid along both axes to stay 16px inside the screen rather than flipped
// (a tall panel slides up over its button, as MUI's did). The trigger gets
// aria-haspopup/aria-expanded; the panel is a dialog named by `label`.
// Size it with a `className` from the caller's module.
export function Popover({
  trigger,
  label,
  align = "start",
  className,
  children,
}: {
  // The button that opens it: one element that can take a ref.
  trigger: ReactElement;
  label: string;
  // Which edge of the button the panel lines up with.
  align?: "start" | "end";
  className?: string;
  children: ReactNode;
}) {
  return (
    <BasePopover.Root modal>
      <BasePopover.Trigger render={trigger} />
      <BasePopover.Portal>
        <BasePopover.Positioner
          side="bottom"
          align={align}
          sideOffset={0}
          collisionPadding={16}
          collisionAvoidance={{ side: "shift", align: "shift" }}
          className={styles.positioner}
        >
          <BasePopover.Popup
            aria-label={label}
            className={[styles.popup, className].filter(Boolean).join(" ")}
          >
            {children}
          </BasePopover.Popup>
        </BasePopover.Positioner>
      </BasePopover.Portal>
    </BasePopover.Root>
  );
}
