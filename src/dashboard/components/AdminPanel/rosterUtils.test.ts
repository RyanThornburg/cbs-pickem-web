import { RosterMember, RosterPayment } from "../../types";
import {
  filterMembers,
  formatDollars,
  gmailComposeUrl,
  paymentDetail,
  paymentStatus,
  payoutTotals,
  rosterTotals,
  todayIso,
} from "./rosterUtils";

const pay = (paid_amount: number, rest: Partial<RosterPayment> = {}) => ({
  paid_amount,
  paid_at: null,
  method: null,
  note: null,
  ...rest,
});

const member = (
  user_id: number,
  payment: RosterPayment | null
): RosterMember => ({
  user_id,
  name: `P${user_id}`,
  email: `p${user_id}@example.com`,
  payment,
});

const users = [
  member(1, pay(200)),
  member(2, pay(100)),
  member(3, null),
  member(4, pay(0)),
  member(5, pay(250)),
];

describe("paymentStatus", () => {
  it("tells paid, part paid and unpaid apart", () => {
    expect(paymentStatus(pay(200), 200)).toEqual({ kind: "paid" });
    expect(paymentStatus(pay(250), 200)).toEqual({ kind: "paid" });
    expect(paymentStatus(pay(100), 200)).toEqual({
      kind: "partial",
      owed: 100,
    });
    expect(paymentStatus(null, 200)).toEqual({ kind: "unpaid" });
    expect(paymentStatus(pay(0), 200)).toEqual({ kind: "unpaid" });
  });

  it("counts any amount as paid when there's no fee", () => {
    expect(paymentStatus(pay(5), null)).toEqual({ kind: "paid" });
    expect(paymentStatus(null, null)).toEqual({ kind: "unpaid" });
  });
});

describe("filterMembers", () => {
  it("keeps part payers on the unpaid list", () => {
    expect(filterMembers(users, "unpaid", 200).map((u) => u.user_id)).toEqual([
      2, 3, 4,
    ]);
    expect(filterMembers(users, "paid", 200).map((u) => u.user_id)).toEqual([
      1, 5,
    ]);
    expect(filterMembers(users, "all", 200)).toHaveLength(5);
  });
});

describe("rosterTotals", () => {
  it("sums what's in and what each member still owes", () => {
    expect(rosterTotals(users, 200)).toEqual({
      members: 5,
      paid: 2,
      collected: 550,
      pot: 1000,
      // 0 + 100 + 200 + 200 + 0: the $50 overpayment doesn't cover anyone.
      owed: 500,
    });
  });

  it("leaves the pot and owed out without a fee", () => {
    expect(rosterTotals(users, null)).toMatchObject({
      paid: 3,
      pot: null,
      owed: null,
    });
  });
});

describe("paymentDetail", () => {
  it("joins the parts that are there", () => {
    expect(
      paymentDetail(
        pay(1200, { paid_at: "2026-09-02", method: "cash_app", note: "rest" })
      )
    ).toBe("$1,200 · Sep 2 · Cash App · rest");
    expect(paymentDetail(pay(200))).toBe("$200");
  });
});

describe("gmailComposeUrl", () => {
  it("puts every address in BCC", () => {
    const url = new URL(gmailComposeUrl(["a@x.com", "b+pool@y.com"]));
    expect(url.origin).toBe("https://mail.google.com");
    expect(url.searchParams.get("view")).toBe("cm");
    expect(url.searchParams.get("bcc")).toBe("a@x.com,b+pool@y.com");
    expect(url.searchParams.get("to")).toBeNull();
  });
});

describe("todayIso", () => {
  it("formats the local date", () => {
    expect(todayIso(new Date(2026, 9, 7, 23, 30))).toBe("2026-10-07");
  });
});

describe("formatDollars", () => {
  it("shows cents only when there are some", () => {
    expect(formatDollars(1380)).toBe("$1,380");
    expect(formatDollars(43.48)).toBe("$43.48");
    expect(formatDollars(12.5)).toBe("$12.50");
    expect(formatDollars(0.1 + 0.2)).toBe("$0.30");
  });
});

describe("payoutTotals", () => {
  const winners = [
    { user_id: 1, owed: 685 },
    { user_id: 2, owed: 75 },
    { user_id: 3, owed: 75 },
    { user_id: 4, owed: null },
  ];

  it("adds up what's owed, paid and left, per winner", () => {
    expect(
      payoutTotals(winners, {
        "1": pay(685),
        "2": pay(50),
        "3": pay(100),
      })
    ).toEqual({ owed: 835, paid: 835, left: 25, winners: 4, paidInFull: 2 });
  });

  it("works in cents", () => {
    const split = [
      { user_id: 1, owed: 43.48 },
      { user_id: 2, owed: 43.48 },
    ];
    expect(payoutTotals(split, { "1": pay(43.48) })).toMatchObject({
      owed: 86.96,
      paid: 43.48,
      left: 43.48,
      paidInFull: 1,
    });
    expect(paymentStatus(pay(43.47), 43.48)).toEqual({
      kind: "partial",
      owed: 0.01,
    });
  });
});
