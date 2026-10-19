import { Select as BaseSelect } from "@base-ui/react/select";
import { InputHTMLAttributes, ReactNode, useState } from "react";
import { Icon } from "../../ui/Icon";
import { SelectOption } from "../../ui/Select";
import selectStyles from "../../ui/Select.module.css";
import styles from "./FormFields.module.css";

// The payment form's fields, as MUI's small outlined TextField looked under
// the theme (measured on the main build): a 36px box with a hairline and
// 8px corners, the label inside it until the field has a value or focus,
// then shrunk onto its top edge, blue while focused and red on an error,
// which also shows a helper line underneath.

const cx = (...names: (string | false | undefined)[]) =>
  names.filter(Boolean).join(" ");

const Label = ({
  id,
  htmlFor,
  shrink,
  focused,
  error,
  children,
  as: Tag = "label",
}: {
  id: string;
  htmlFor?: string;
  shrink: boolean;
  focused: boolean;
  error?: boolean;
  children: ReactNode;
  as?: "label" | "div";
}) => (
  <Tag
    id={id}
    htmlFor={htmlFor}
    data-shrink={shrink}
    className={cx(
      styles.label,
      shrink && styles.shrunk,
      focused && styles.labelFocused,
      error && styles.labelError
    )}
  >
    {children}
  </Tag>
);

export function TextField({
  id,
  label,
  value,
  onChange,
  type = "text",
  error = false,
  helperText,
  shrink: alwaysShrink = false,
  placeholder,
  inputProps,
  autoFocus,
  className,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "number" | "date";
  error?: boolean;
  helperText?: string;
  // Keep the label on the edge even when empty (the date field, whose
  // empty box still shows mm/dd/yyyy).
  shrink?: boolean;
  placeholder?: string;
  inputProps?: Pick<
    InputHTMLAttributes<HTMLInputElement>,
    "min" | "step" | "inputMode" | "maxLength"
  >;
  autoFocus?: boolean;
  className?: string;
}) {
  const [focused, setFocused] = useState(false);
  const shrink = alwaysShrink || focused || value !== "";
  const helperId = helperText ? `${id}-helper-text` : undefined;
  return (
    <div className={cx(styles.field, className)}>
      <Label
        id={`${id}-label`}
        htmlFor={id}
        shrink={shrink}
        focused={focused}
        error={error}
      >
        {label}
      </Label>
      <div className={cx(styles.box, focused && styles.focused)}>
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          aria-invalid={error}
          aria-describedby={helperId}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={cx(styles.input, !shrink && styles.placeholderHidden)}
          {...inputProps}
        />
      </div>
      {helperText && (
        <p
          id={helperId}
          className={cx(styles.helper, error && styles.helperError)}
        >
          {helperText}
        </p>
      )}
    </div>
  );
}

// A TextField with `select`: the same box and label around Base UI's
// Select, in ui/Select's menu look (its classes), which was MUI's standard
// Select menu. Built here rather than on ui/Select for one thing it can't
// set: near the bottom of a phone screen MUI kept the menu below and slid
// it up over the field, where ui/Select flips it above. An empty value
// shows nothing in the box and leaves the label inside it, as MUI's did.
export function SelectField<V extends string>({
  id,
  label,
  value,
  onChange,
  options,
  renderValue,
  className,
}: {
  id: string;
  label: string;
  value: V;
  onChange: (value: V) => void;
  options: SelectOption<V>[];
  renderValue: (value: V) => ReactNode;
  className?: string;
}) {
  // Focus inside, menu included: React's focus events bubble out of the
  // menu's portal, so the box stays lit while the menu is open, as MUI's.
  const [focused, setFocused] = useState(false);
  const shrink = focused || value !== "";
  return (
    <div
      className={cx(styles.field, className)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      <Label as="div" id={`${id}-label`} shrink={shrink} focused={focused}>
        {label}
      </Label>
      <BaseSelect.Root
        value={value}
        onValueChange={(next) => onChange(next as V)}
      >
        <BaseSelect.Trigger
          id={id}
          aria-labelledby={`${id}-label`}
          className={cx(
            selectStyles.trigger,
            styles.box,
            styles.selectBox,
            focused && styles.focused
          )}
        >
          <BaseSelect.Value
            className={cx(selectStyles.value, styles.selectValue)}
          >
            {(current: V) =>
              current === "" ? (
                <span aria-hidden>{"\u200b"}</span>
              ) : (
                renderValue(current)
              )
            }
          </BaseSelect.Value>
          <BaseSelect.Icon className={cx(selectStyles.icon, styles.selectIcon)}>
            <Icon name="UnfoldMoreRounded" size="inherit" />
          </BaseSelect.Icon>
        </BaseSelect.Trigger>
        <BaseSelect.Portal>
          <BaseSelect.Positioner
            side="bottom"
            align="start"
            alignOffset={1}
            sideOffset={4}
            // MUI kept 16px from the screen's edges, then moved the menu
            // 4px down (the theme's top margin on it).
            collisionPadding={{ top: 20, right: 16, bottom: 12, left: 16 }}
            collisionAvoidance={{ side: "shift", align: "shift" }}
            alignItemWithTrigger={false}
            className={selectStyles.positioner}
          >
            <BaseSelect.Popup className={selectStyles.popup}>
              <BaseSelect.List className={selectStyles.list}>
                {options.map((option) => (
                  <BaseSelect.Item
                    key={option.value}
                    value={option.value}
                    className={selectStyles.item}
                  >
                    <BaseSelect.ItemText>{option.label}</BaseSelect.ItemText>
                  </BaseSelect.Item>
                ))}
              </BaseSelect.List>
            </BaseSelect.Popup>
          </BaseSelect.Positioner>
        </BaseSelect.Portal>
      </BaseSelect.Root>
    </div>
  );
}
