import dayjs from "dayjs";
import { PaymentMethod, RosterMember, RosterPayment } from "../../types";

export const METHOD_LABEL: Record<PaymentMethod, string> = {
  venmo: "Venmo",
  paypal: "PayPal",
  cash_app: "Cash App",
  cash: "Cash",
  other: "Other",
};
export const METHODS = Object.keys(METHOD_LABEL) as PaymentMethod[];

export type RosterFilter = "all" | "unpaid" | "paid";

export type PaymentStatus =
  { kind: "paid" } | { kind: "partial"; owed: number } | { kind: "unpaid" };

const toCents = (amount: number) => Math.round(amount * 100) / 100;

// Paid in full, part paid, or nothing yet. A $0 record counts as nothing.
// Without a fee there's nothing to compare against, so any amount is paid.
// Also a payout against what the winner is owed, so it works in cents.
export const paymentStatus = (
  payment: RosterPayment | null,
  fee: number | null
): PaymentStatus => {
  const amount = payment?.paid_amount ?? 0;
  if (amount <= 0) return { kind: "unpaid" };
  if (fee !== null && toCents(fee - amount) > 0)
    return { kind: "partial", owed: toCents(fee - amount) };
  return { kind: "paid" };
};

// "Unpaid" means not paid in full, so part payers stay on the chase list.
export const filterMembers = (
  users: RosterMember[],
  filter: RosterFilter,
  fee: number | null
): RosterMember[] =>
  filter === "all"
    ? users
    : users.filter(
        (u) =>
          (paymentStatus(u.payment, fee).kind === "paid") ===
          (filter === "paid")
      );

export interface RosterTotals {
  members: number;
  paid: number;
  collected: number;
  // Null without a fee.
  pot: number | null;
  owed: number | null;
}

export const rosterTotals = (
  users: RosterMember[],
  fee: number | null
): RosterTotals => ({
  members: users.length,
  paid: users.filter((u) => paymentStatus(u.payment, fee).kind === "paid")
    .length,
  collected: users.reduce((sum, u) => sum + (u.payment?.paid_amount ?? 0), 0),
  pot: fee === null ? null : fee * users.length,
  // Per member, so one overpayment doesn't hide someone else's debt.
  owed:
    fee === null
      ? null
      : users.reduce(
          (sum, u) => sum + Math.max(0, fee - (u.payment?.paid_amount ?? 0)),
          0
        ),
});

// "$200", or "$43.48" when there are cents (a split prize).
export const formatDollars = (amount: number) => {
  const cents = !Number.isInteger(toCents(amount));
  return `$${toCents(amount).toLocaleString("en-US", {
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
};

// "$200 · Sep 2 · Venmo · rest after week 4"
export const paymentDetail = (payment: RosterPayment): string =>
  [
    formatDollars(payment.paid_amount),
    payment.paid_at && dayjs(payment.paid_at).format("MMM D"),
    payment.method && METHOD_LABEL[payment.method],
    payment.note,
  ]
    .filter(Boolean)
    .join(" · ");

// A Gmail draft with everyone in BCC, so no one sees the others' addresses.
// Opens in the browser's Gmail whatever the computer's mail app is.
export const gmailComposeUrl = (emails: string[]): string =>
  `https://mail.google.com/mail/?view=cm&fs=1&bcc=${encodeURIComponent(
    emails.join(",")
  )}`;

// Today in the browser's own time zone, for the date input's default.
export const todayIso = (now = new Date()) => dayjs(now).format("YYYY-MM-DD");

export interface PayoutTotals {
  owed: number;
  paid: number;
  // Still to pay, per winner, so one overpayment doesn't hide another's.
  left: number;
  winners: number;
  paidInFull: number;
}

// One prize's money: what its winners are owed (the data's amounts), what's
// been paid against it, and what's left.
export const payoutTotals = (
  winners: { user_id: number; owed: number | null }[],
  paid: Record<string, RosterPayment> | undefined
): PayoutTotals => {
  const amount = (id: number) => paid?.[String(id)]?.paid_amount ?? 0;
  return {
    owed: toCents(winners.reduce((sum, w) => sum + (w.owed ?? 0), 0)),
    paid: toCents(winners.reduce((sum, w) => sum + amount(w.user_id), 0)),
    left: toCents(
      winners.reduce(
        (sum, w) => sum + Math.max(0, (w.owed ?? 0) - amount(w.user_id)),
        0
      )
    ),
    winners: winners.length,
    paidInFull: winners.filter(
      (w) =>
        paymentStatus(paid?.[String(w.user_id)] ?? null, w.owed).kind === "paid"
    ).length,
  };
};
