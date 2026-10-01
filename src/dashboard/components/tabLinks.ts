import { createContext, MouseEvent, useContext } from "react";
import { AppTab } from "../utils/defaultTab";

// The tab rows (desktop's and PhoneTabBar) are links to each tab's route,
// so middle-click, cmd/ctrl-click and "open in new tab" work. A plain click
// stays in the app instead: `go` saves the tab and scrolls to the top.
export const tabHref = (value: AppTab, search: string) => `/${value}${search}`;

export const followTabLink = (
  event: MouseEvent,
  value: AppTab,
  go: (value: AppTab) => void
) => {
  if (
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return;
  }
  event.preventDefault();
  go(value);
};

// Whether the tab a component sits in is the one on screen. MainGrid keeps
// every weekly tab mounted (so switching back is instant), and their polls
// check this to pause while hidden, then refresh as soon as they're shown.
export const TabActiveContext = createContext(true);
export const useTabActive = () => useContext(TabActiveContext);
