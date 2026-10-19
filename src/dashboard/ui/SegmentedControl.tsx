import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup } from "@base-ui/react/toggle-group";
import { ReactNode } from "react";
import styles from "./SegmentedControl.module.css";

export interface Segment<V extends string> {
  value: V;
  // Visible content; the segment's accessible name unless `label` is set.
  children: ReactNode;
  label?: string;
}

// A row of segments with exactly one pressed (Base UI's ToggleGroup).
// Pressing the pressed segment again does nothing, as MUI's exclusive
// ToggleButtonGroup did for every caller. Arrow keys move between segments,
// with one tab stop for the group.
export function SegmentedControl<V extends string>({
  value,
  onChange,
  segments,
  label,
  className,
}: {
  value: V | null;
  onChange: (value: V) => void;
  segments: Segment<V>[];
  // The group's accessible name ("NFL view").
  label: string;
  className?: string;
}) {
  return (
    <ToggleGroup
      value={value === null ? [] : [value]}
      onValueChange={(next) => {
        const [picked] = next as V[];
        if (picked !== undefined) onChange(picked);
      }}
      aria-label={label}
      className={[styles.group, className].filter(Boolean).join(" ")}
    >
      {segments.map((segment) => (
        <Toggle
          key={segment.value}
          value={segment.value}
          aria-label={segment.label}
          className={styles.segment}
        >
          {segment.children}
        </Toggle>
      ))}
    </ToggleGroup>
  );
}
