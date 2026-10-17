// The Admin page's Roster: who's in the pool, their email, and what they've
// paid. Names and emails come from `admin:users` (the pipeline rewrites it
// daily), the entry fee from `meta:current`, and payments from
// `roster:{season}`, the one key in PICKEM_KV this Worker writes. The data
// repo reads `users.{id}.paid_amount` from it and backs it up to D1, so it
// has to live in PICKEM_KV rather than a namespace of our own. Everything
// here sits behind verifyAdmin: `admin:users` holds every member's email,
// including the ones hidden on CBS.

export const PAYMENT_METHODS = [
  "venmo",
  "paypal",
  "cash_app",
  "cash",
  "other",
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export interface Payment {
  // Whole dollars. The only field the pipeline reads.
  paid_amount: number;
  // YYYY-MM-DD, as entered.
  paid_at: string | null;
  method: PaymentMethod | null;
  note: string | null;
}

export interface RosterKey {
  season: number;
  updated_at: string;
  // Keyed by user_id as a string, the shape the data repo reads.
  users: Record<string, Payment>;
}

interface AdminUsersKey {
  updated_at: string;
  users: {
    user_id: number;
    name: string;
    email: string | null;
    is_active: boolean;
  }[];
}

export interface RosterResponse {
  season: number;
  entry_fee: number | null;
  // When the pipeline last rewrote admin:users, and when a payment was last
  // saved (null before the first save of the season).
  users_updated_at: string | null;
  updated_at: string | null;
  // Active members only, by name.
  users: {
    user_id: number;
    name: string;
    email: string | null;
    payment: Payment | null;
  }[];
}

const MAX_AMOUNT = 10_000;
const MAX_NOTE = 200;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const rosterKey = (season: number) => `roster:${season}`;

// The Worker's only write to PICKEM_KV. The key is built here from a number,
// so no request can steer it at another key.
async function writeRoster(
  kv: KVNamespace,
  season: number,
  roster: RosterKey
): Promise<void> {
  if (!Number.isInteger(season) || season < 2000 || season > 2100) {
    throw new Error(`refusing to write roster for season ${season}`);
  }
  await kv.put(rosterKey(season), JSON.stringify(roster));
}

// No edge cache on these reads: the page reads right after a save, and a
// write then read-back must see the write.
const readRoster = async (
  kv: KVNamespace,
  season: number
): Promise<RosterKey> =>
  (await kv.get<RosterKey>(rosterKey(season), "json")) ?? {
    season,
    updated_at: "",
    users: {},
  };

export async function buildRoster(
  kv: KVNamespace,
  season: number,
  roster?: RosterKey
): Promise<RosterResponse | null> {
  const [adminUsers, meta, saved] = await Promise.all([
    kv.get<AdminUsersKey>("admin:users", "json"),
    kv.get<{ season?: number; entry_fee?: number | null }>(
      "meta:current",
      "json"
    ),
    roster ?? readRoster(kv, season),
  ]);
  if (!adminUsers) return null;
  return {
    season,
    // The fee in meta:current is the current season's.
    entry_fee: meta?.season === season ? (meta.entry_fee ?? null) : null,
    users_updated_at: adminUsers.updated_at ?? null,
    updated_at: saved.updated_at || null,
    users: adminUsers.users
      .filter((u) => u.is_active)
      .map((u) => ({
        user_id: u.user_id,
        name: u.name,
        email: u.email || null,
        payment: saved.users[String(u.user_id)] ?? null,
      }))
      .sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
      ),
  };
}

// Checks a saved payment from the page. Returns the clean value or a reason.
export function parsePayment(body: unknown): Payment | string {
  if (!body || typeof body !== "object") return "body must be an object";
  const b = body as Record<string, unknown>;
  const amount = b.paid_amount;
  if (
    typeof amount !== "number" ||
    !Number.isInteger(amount) ||
    amount < 0 ||
    amount > MAX_AMOUNT
  ) {
    return `paid_amount must be whole dollars from 0 to ${MAX_AMOUNT}`;
  }
  const paidAt = b.paid_at ?? null;
  if (
    paidAt !== null &&
    (typeof paidAt !== "string" ||
      !DATE_PATTERN.test(paidAt) ||
      Number.isNaN(Date.parse(paidAt)))
  ) {
    return "paid_at must be YYYY-MM-DD";
  }
  const method = b.method ?? null;
  if (method !== null && !PAYMENT_METHODS.includes(method as PaymentMethod)) {
    return `method must be one of ${PAYMENT_METHODS.join(", ")}`;
  }
  const note = b.note ?? null;
  if (note !== null && typeof note !== "string") return "note must be text";
  const trimmed = note?.trim() ?? "";
  if (trimmed.length > MAX_NOTE) return `note is over ${MAX_NOTE} characters`;
  return {
    paid_amount: amount,
    paid_at: paidAt,
    method: method as PaymentMethod | null,
    note: trimmed || null,
  };
}

// Sets (payment) or clears (null) one member's payment: read the whole key,
// change one entry, write it back. Last write wins, fine with one admin.
// Returns null when the user isn't in admin:users.
export async function savePayment(
  kv: KVNamespace,
  season: number,
  userId: number,
  payment: Payment | null,
  now: Date = new Date()
): Promise<RosterResponse | null> {
  const adminUsers = await kv.get<AdminUsersKey>("admin:users", "json");
  if (!adminUsers?.users.some((u) => u.user_id === userId)) return null;

  const roster = await readRoster(kv, season);
  const users = { ...roster.users };
  if (payment) users[String(userId)] = payment;
  else delete users[String(userId)];
  const next: RosterKey = { season, updated_at: now.toISOString(), users };
  await writeRoster(kv, season, next);
  return buildRoster(kv, season, next);
}
