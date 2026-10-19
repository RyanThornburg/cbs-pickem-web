import { Tabs as BaseTabs } from "@base-ui/react/tabs";
import { ReactNode } from "react";
import styles from "./Tabs.module.css";

export interface TabItem<V extends string> {
  value: V;
  label: ReactNode;
}

// A row of tabs over one panel (Base UI's Tabs), in the look MUI's Tabs
// had here. Arrow keys move between tabs; the panel is labelled by the
// selected tab and gets the content for it. `listClassName` and
// `tabClassName` adjust the row from the caller's module (Records draws a
// hairline under it; the leader cards make the tabs 40px tall).
export function Tabs<V extends string>({
  value,
  onChange,
  tabs,
  label,
  className,
  listClassName,
  tabClassName,
  panelClassName,
  children,
}: {
  value: V;
  onChange: (value: V) => void;
  tabs: TabItem<V>[];
  label?: string;
  // The wrapper around the row and the panel.
  className?: string;
  listClassName?: string;
  tabClassName?: string;
  panelClassName?: string;
  // The selected tab's content.
  children: ReactNode;
}) {
  return (
    <BaseTabs.Root
      value={value}
      onValueChange={(next) => onChange(next as V)}
      className={className}
    >
      <BaseTabs.List
        aria-label={label}
        className={[styles.list, listClassName].filter(Boolean).join(" ")}
      >
        {tabs.map((tab) => (
          <BaseTabs.Tab
            key={tab.value}
            value={tab.value}
            className={[styles.tab, tabClassName].filter(Boolean).join(" ")}
          >
            {tab.label}
          </BaseTabs.Tab>
        ))}
        <BaseTabs.Indicator className={styles.indicator} />
      </BaseTabs.List>
      <BaseTabs.Panel value={value} className={panelClassName}>
        {children}
      </BaseTabs.Panel>
    </BaseTabs.Root>
  );
}
