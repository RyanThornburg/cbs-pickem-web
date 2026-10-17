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

// Paid in full, part paid, or nothing yet. A $0 record counts as nothing.
// Without a fee there's nothing to compare against, so any amount is paid.
export const paymentStatus = (
  payment: RosterPayment | null,
  fee: number | null
): PaymentStatus => {
  const amount = payment?.paid_amount ?? 0;
  if (amount <= 0) return { kind: "unpaid" };
  if (fee !== null && amount < fee)
    return { kind: "partial", owed: fee - amount };
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

export const formatDollars = (amount: number) =>
  `$${amount.toLocaleString("en-US")}`;

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
