import dayjs from "dayjs";

// One way to say when something was last updated, on every tab: the time
// alone today ("9:02 AM"), the weekday this past week ("Fri 11:51 PM"), and
// the date before that ("Sep 28, 11:51 PM"). Feeds that were refreshed
// minutes ago read as a time; ones days old say so.
export function formatUpdated(at: Date | string | number, now = new Date()) {
  const when = dayjs(at);
  const today = dayjs(now);
  if (when.isSame(today, "day")) return when.format("h:mm A");
  if (when.isAfter(today.subtract(6, "day").startOf("day")))
    return when.format("ddd h:mm A");
  return when.format("MMM D, h:mm A");
}
