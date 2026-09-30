import { ordinal } from "./helper";

describe("ordinal", () => {
  it("handles the teens and the usual suffixes", () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 33].map(ordinal)).toEqual([
      "1st",
      "2nd",
      "3rd",
      "4th",
      "11th",
      "12th",
      "13th",
      "21st",
      "22nd",
      "33rd",
    ]);
  });

  it("treats 111-113 like 11-13, and 101 like 1", () => {
    expect([101, 102, 111, 112, 113, 121].map(ordinal)).toEqual([
      "101st",
      "102nd",
      "111th",
      "112th",
      "113th",
      "121st",
    ]);
  });
});
