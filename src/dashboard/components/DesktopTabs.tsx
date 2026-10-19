import { ReactNode, useLayoutEffect, useRef, useState } from "react";
import styles from "./DesktopTabs.module.css";

// The desktop tab row's links in a row that scrolls sideways on a narrow
// window, with an underline that slides to the selected one. Each child is
// a link (see MainGrid's tab links) marked with data-tab={its value}.
export function DesktopTabs({
  selected,
  children,
}: {
  // null when the page isn't one of the tabs: no underline then.
  selected: string | null;
  children: ReactNode;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  // Measured, so it follows the tab's real width: a label that changes, a
  // font that loads late, or an Admin tab that turns up after the check.
  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    const list = listRef.current;
    if (!scroller || !list) return undefined;
    const measure = () => {
      const tab = selected
        ? list.querySelector<HTMLElement>(
            `[data-tab="${CSS.escape(selected)}"]`
          )
        : null;
      if (!tab) {
        setIndicator({ left: 0, width: 0 });
        return;
      }
      const tabRect = tab.getBoundingClientRect();
      const left =
        tabRect.left -
        scroller.getBoundingClientRect().left +
        scroller.scrollLeft;
      setIndicator((old) =>
        old.left === left && old.width === tabRect.width
          ? old
          : { left, width: tabRect.width }
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    for (const tab of list.children) observer.observe(tab);
    return () => observer.disconnect();
  }, [selected, children]);

  return (
    <div className={styles.tabs}>
      <div ref={scrollerRef} className={styles.scroller}>
        <div ref={listRef} className={styles.list}>
          {children}
        </div>
        <span
          aria-hidden
          className={styles.indicator}
          style={{ left: indicator.left, width: indicator.width }}
        />
      </div>
    </div>
  );
}
