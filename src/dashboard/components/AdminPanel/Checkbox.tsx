import styles from "./Checkbox.module.css";

// MUI's checkbox icons: empty, checked, and the dash for some-but-not-all.
const PATHS = {
  blank:
    "M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z",
  checked:
    "M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.11 0 2-.9 2-2V5c0-1.1-.89-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z",
  indeterminate:
    "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10H7v-2h10v2z",
};

// MUI's Checkbox as the roster table drew it (measured on the main build):
// a 24px box icon, grey until checked, then blue, over a native checkbox
// that takes the clicks and the keyboard. The table's checkbox cells
// stripped MUI's 9px padding, so there's none here.
export function Checkbox({
  checked,
  indeterminate = false,
  disabled = false,
  onChange,
  label,
}: {
  checked: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  onChange: () => void;
  label: string;
}) {
  const icon = indeterminate ? "indeterminate" : checked ? "checked" : "blank";
  return (
    <span
      className={[
        styles.checkbox,
        (checked || indeterminate) && styles.on,
        disabled && styles.disabled,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        aria-label={label}
        // What MUI set: the native box isn't put in its mixed state.
        data-indeterminate={indeterminate}
        aria-checked={indeterminate ? "mixed" : undefined}
        className={styles.input}
      />
      <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
        <path d={PATHS[icon]} />
      </svg>
    </span>
  );
}
