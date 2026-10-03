import { formatUpdated } from "./updatedTime";

describe("formatUpdated", () => {
  const now = new Date(2026, 9, 3, 14, 0); // Sat Oct 3, 2:00 PM local

  it("shows only the time today", () => {
    expect(formatUpdated(new Date(2026, 9, 3, 9, 2), now)).toBe("9:02 AM");
  });

  it("shows the weekday within the past week", () => {
    expect(formatUpdated(new Date(2026, 9, 2, 23, 51), now)).toBe(
      "Fri 11:51 PM"
    );
    expect(formatUpdated(new Date(2026, 8, 27, 0, 5), now)).toBe(
      "Sun 12:05 AM"
    );
  });

  it("shows the date once it's a week or more old", () => {
    expect(formatUpdated(new Date(2026, 8, 26, 23, 51), now)).toBe(
      "Sep 26, 11:51 PM"
    );
  });
});
