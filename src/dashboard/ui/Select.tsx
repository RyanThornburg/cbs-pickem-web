import { Select as BaseSelect } from "@base-ui/react/select";
import { ReactNode } from "react";
import { Icon } from "./Icon";
import styles from "./Select.module.css";

export interface SelectOption<V extends string> {
  value: V;
  // What the menu shows for it.
  label: ReactNode;
}

// A dropdown (Base UI's Select) in the look MUI's standard Select had here:
// the menu drops below the trigger rather than over it, the chosen option
// is highlighted and focused when it opens, arrow keys and type-ahead move
// through it, Enter picks. `renderValue` draws the trigger's value, for the
// Week pill's "Wk 3" and the player card. `className` styles the trigger
// (padding, height, corners) from the caller's module.
export function Select<V extends string>({
  value,
  onChange,
  options,
  renderValue,
  labelledBy,
  id,
  className,
  valueClassName,
  open,
  onOpenChange,
  onOpenChangeComplete,
}: {
  value: V;
  onChange: (value: V) => void;
  options: SelectOption<V>[];
  renderValue: (value: V) => ReactNode;
  // The id of a (visually hidden) label naming the select.
  labelledBy?: string;
  id?: string;
  className?: string;
  valueClassName?: string;
  // Optional control from outside (the "Choose your name" hint opens the
  // player picker).
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  // After the menu has finished closing.
  onOpenChangeComplete?: (open: boolean) => void;
}) {
  return (
    <BaseSelect.Root
      value={value}
      onValueChange={(next) => onChange(next as V)}
      open={open}
      onOpenChange={onOpenChange ? (next) => onOpenChange(next) : undefined}
      onOpenChangeComplete={onOpenChangeComplete}
    >
      <BaseSelect.Trigger
        id={id}
        aria-labelledby={labelledBy}
        className={[styles.trigger, className].filter(Boolean).join(" ")}
      >
        <BaseSelect.Value
          className={[styles.value, valueClassName].filter(Boolean).join(" ")}
        >
          {(current: V) => renderValue(current)}
        </BaseSelect.Value>
        <BaseSelect.Icon className={styles.icon}>
          <Icon name="UnfoldMoreRounded" size="inherit" />
        </BaseSelect.Icon>
      </BaseSelect.Trigger>
      <BaseSelect.Portal>
        <BaseSelect.Positioner
          side="bottom"
          align="start"
          alignOffset={1}
          sideOffset={4}
          collisionPadding={16}
          alignItemWithTrigger={false}
          className={styles.positioner}
        >
          <BaseSelect.Popup className={styles.popup}>
            <BaseSelect.List className={styles.list}>
              {options.map((option) => (
                <BaseSelect.Item
                  key={option.value}
                  value={option.value}
                  className={styles.item}
                >
                  <BaseSelect.ItemText>{option.label}</BaseSelect.ItemText>
                </BaseSelect.Item>
              ))}
            </BaseSelect.List>
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  );
}
