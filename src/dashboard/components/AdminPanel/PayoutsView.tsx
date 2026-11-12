import { ReactNode, useEffect, useMemo, useState } from "react";
import { ordinal } from "../../helper";
import { AdminUnauthorizedError } from "../../data/GetAdminStatus";
import {
  FinishedPrize,
  GetFinishedPrizes,
  PrizeWinner,
} from "../../data/GetFinishedPrizes";
import {
  GetRoster,
  RosterNotReadyError,
  SavePayout,
} from "../../data/GetRoster";
import { Roster, RosterPayment } from "../../types";
import table from "../../ui/table.module.css";
import uiStyles from "../../ui/ui.module.css";
import { Button } from "../../ui/Button";
import { Chip } from "../../ui/Chip";
import { formatUpdated } from "../../utils/updatedTime";
import { periodName, periodWeeksText } from "../../utils/payPeriods";
import { useCurrentWeek } from "../CurrentWeekContext";
import LoadError from "../shared/LoadError";
import { PlayerLink } from "../shared/PlayerLink";
import TabIntro from "../TabIntro";
import TabSkeleton from "../TabSkeleton";
import { AdminActions, LogoutButton } from "./AdminControls";
import { PaymentForm } from "./PaymentForm";
import {
  formatDollars,
  entryMethodText,
  paymentDetail,
  paymentStatus,
  payoutTotals,
} from "./rosterUtils";
import rosterStyles from "./RosterView.module.css";
import styles from "./PayoutsView.module.css";

// Admin › Payouts: prize money owed to each finished prize's winners, and
// what's been paid. What's owed comes from the data (each winner's `payout`
// on the prize's last week, ties split there); payments save to
// roster:{season}'s `payouts` through the Worker, beside the entry fees.

const cx = (...names: (string | false | undefined)[]) =>
  names.filter(Boolean).join(" ");

const HEAD = [table.cell, table.small, table.head];
const BODY = [table.cell, table.small];

const Stat = ({ value, label }: { value: ReactNode; label: string }) => (
  <div>
    <p className={rosterStyles.statValue}>{value}</p>
    <span className={rosterStyles.statLabel}>{label}</span>
  </div>
);

const placeText = (w: PrizeWinner) => `${w.tied ? "T" : ""}${w.place}`;

const StatusChip = ({
  payout,
  owed,
}: {
  payout: RosterPayment | null;
  owed: number | null;
}) => {
  const status = paymentStatus(payout, owed);
  if (status.kind === "paid") {
    return <Chip label="Paid" className={rosterStyles.paidChip} />;
  }
  return (
    <Chip
      label={
        status.kind === "partial"
          ? `${formatDollars(status.owed)} left`
          : "Unpaid"
      }
    />
  );
};

// "$685 · $450 · $300" for 1st, 2nd and 3rd.
const payoutsText = (prize: FinishedPrize) =>
  prize.period.payouts?.length
    ? prize.period.payouts.map((p) => formatDollars(p)).join(" · ")
    : null;

function PrizeSection({
  prize,
  paid,
  entries,
  editing,
  saving,
  saveError,
  onEdit,
  onSave,
}: {
  prize: FinishedPrize;
  paid: Record<string, RosterPayment> | undefined;
  // Each winner's entry fee record by user id, for how they paid in.
  entries: Map<number, RosterPayment | null>;
  editing: string | null;
  saving: boolean;
  saveError: string | null;
  onEdit: (id: string | null) => void;
  onSave: (userId: number, payout: RosterPayment | null) => void;
}) {
  const { period, winners } = prize;
  const totals = payoutTotals(winners, paid);
  const name = periodName(period);
  const amounts = payoutsText(prize);
  const headingId = `payouts-${period.key}`;
  return (
    <section aria-labelledby={headingId} className={styles.prize}>
      <div className={styles.prizeHead}>
        <h3 id={headingId} className={styles.prizeTitle}>
          {name}
        </h3>
        <span className={rosterStyles.caption}>
          {periodWeeksText(period).replace(/^w/, "W")} · top{" "}
          {period.paid_places} paid
          {amounts && ` (${amounts})`}
        </span>
        <span className={styles.prizeMoney}>
          {formatDollars(totals.paid)} of {formatDollars(totals.owed)} paid
          {totals.left > 0 && (
            <span className={rosterStyles.muted}>
              {" "}
              · {formatDollars(totals.left)} left
            </span>
          )}
        </span>
      </div>
      <div className={cx(table.container, rosterStyles.tableBox)}>
        <table className={cx(table.table, rosterStyles.table)}>
          <thead>
            <tr>
              <th
                scope="col"
                className={cx(...HEAD, styles.placeCell, rosterStyles.smUp)}
              >
                Place
              </th>
              <th scope="col" className={cx(...HEAD)}>
                Winner
              </th>
              <th scope="col" className={cx(...HEAD, table.right)}>
                Owed
              </th>
              <th scope="col" className={cx(...HEAD, rosterStyles.smUp)}>
                Status
              </th>
              <th scope="col" className={cx(...HEAD, rosterStyles.smUp)}>
                Paid
              </th>
              <th scope="col" className={cx(...HEAD)}>
                <span className={uiStyles.visuallyHidden}>Edit</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {winners.length === 0 && (
              <tr>
                <td colSpan={6} className={cx(...BODY, rosterStyles.emptyCell)}>
                  No winners in the data for this prize.
                </td>
              </tr>
            )}
            {winners.map((w) => {
              const payout = paid?.[String(w.user_id)] ?? null;
              const rowId = `${period.key}-${w.user_id}`;
              const isEditing = editing === rowId;
              return [
                <tr key={rowId}>
                  <td
                    className={cx(...BODY, styles.placeCell, rosterStyles.smUp)}
                  >
                    <span className={styles.place}>{placeText(w)}</span>
                  </td>
                  <td className={cx(...BODY, rosterStyles.nameCell)}>
                    {/* The place leads the name where its column is hidden. */}
                    <span className={styles.placeInline}>{placeText(w)}</span>
                    <PlayerLink
                      id={String(w.user_id)}
                      className={rosterStyles.name}
                    >
                      {w.name}
                    </PlayerLink>
                    {w.tied && (
                      <span className={styles.note}>
                        Tied for {ordinal(w.place)}, prize split
                      </span>
                    )}
                    {/* Prizes usually go back the way the entry came in. */}
                    <span className={styles.note}>
                      {entryMethodText(entries.get(w.user_id))}
                    </span>
                    {payout && (
                      <span className={rosterStyles.paymentUnder}>
                        {paymentDetail(payout)}
                      </span>
                    )}
                    <div className={rosterStyles.statusUnder}>
                      <StatusChip payout={payout} owed={w.owed} />
                    </div>
                  </td>
                  <td className={cx(...BODY, table.right, styles.owed)}>
                    {w.owed === null ? (
                      <span
                        className={rosterStyles.faint}
                        title="The data doesn't carry this amount"
                      >
                        –
                      </span>
                    ) : (
                      formatDollars(w.owed)
                    )}
                  </td>
                  <td className={cx(...BODY, rosterStyles.smUp)}>
                    <StatusChip payout={payout} owed={w.owed} />
                  </td>
                  <td
                    className={cx(
                      ...BODY,
                      rosterStyles.smUp,
                      rosterStyles.muted
                    )}
                  >
                    {payout ? paymentDetail(payout) : "–"}
                  </td>
                  <td className={cx(...BODY, table.right)}>
                    <Button
                      size="small"
                      onClick={() => onEdit(isEditing ? null : rowId)}
                      aria-expanded={isEditing}
                      aria-label={`${payout ? "Edit payout" : "Mark paid"} for ${w.name}, ${name}`}
                      style={{ whiteSpace: "nowrap" }}
                    >
                      {payout ? "Edit" : "Mark paid"}
                    </Button>
                  </td>
                </tr>,
                isEditing && (
                  <tr key={`${rowId}-edit`}>
                    <td
                      colSpan={6}
                      className={cx(...BODY, rosterStyles.formCell)}
                    >
                      <PaymentForm
                        idBase={`payout-${rowId}`}
                        label={`${name} payout for ${w.name}`}
                        payment={payout}
                        defaultAmount={w.owed}
                        defaultMethod={entries.get(w.user_id)?.method ?? null}
                        cents
                        saving={saving}
                        error={saveError}
                        onSave={(p) => onSave(w.user_id, p)}
                        onClear={() => onSave(w.user_id, null)}
                        onCancel={() => onEdit(null)}
                      />
                    </td>
                  </tr>
                ),
              ];
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function PayoutsView({ viewSwitch }: { viewSwitch: ReactNode }) {
  const { season, currentWeek, periods } = useCurrentWeek();
  const [roster, setRoster] = useState<Roster | null>(null);
  const [prizes, setPrizes] = useState<FinishedPrize[] | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!season || !currentWeek || !periods.length) return;
    let cancelled = false;
    Promise.all([
      GetRoster(season),
      GetFinishedPrizes(season, currentWeek, periods),
    ]).then(
      ([rosterData, prizeData]) => {
        if (cancelled) return;
        setRoster(rosterData);
        setPrizes(prizeData);
        setError(null);
      },
      (err: Error) => !cancelled && setError(err)
    );
    return () => {
      cancelled = true;
    };
  }, [season, currentWeek, periods, attempt]);

  const save =
    (periodKey: string) =>
    async (userId: number, payout: RosterPayment | null) => {
      setSaving(true);
      setSaveError(null);
      try {
        setRoster(await SavePayout(season, periodKey, userId, payout));
        setEditing(null);
      } catch (err) {
        if (err instanceof AdminUnauthorizedError) setError(err);
        setSaveError(err instanceof Error ? err.message : String(err));
      } finally {
        setSaving(false);
      }
    };

  const unauthorized = error instanceof AdminUnauthorizedError;
  const ready = roster && prizes;
  const entries = useMemo(
    () => new Map((roster?.users ?? []).map((m) => [m.user_id, m.payment])),
    [roster]
  );
  const all = ready
    ? prizes.map((p) => payoutTotals(p.winners, roster.payouts?.[p.period.key]))
    : [];
  const sum = (pick: (t: (typeof all)[number]) => number) =>
    all.reduce((total, t) => total + pick(t), 0);

  return (
    <>
      <TabIntro
        title="Admin"
        meta={
          roster?.updated_at
            ? `Payouts ${season} · saved ${formatUpdated(roster.updated_at)}`
            : `Payouts ${season}`
        }
        actions={
          <AdminActions>
            {viewSwitch}
            <LogoutButton />
          </AdminActions>
        }
      />
      <div className={rosterStyles.page}>
        {unauthorized ? (
          <LoadError
            title="Your admin session has expired or you're not signed in."
            detail="Sign in again to see or record payouts."
            actions={
              <Button
                variant="outlined"
                size="small"
                href="/admin?view=payouts"
              >
                Sign in
              </Button>
            }
          />
        ) : error instanceof RosterNotReadyError ? (
          <LoadError
            title="No member list yet"
            detail="The pipeline writes names and emails (admin:users) on its daily run."
            onRetry={() => setAttempt((n) => n + 1)}
          />
        ) : error && !ready ? (
          <LoadError
            title="Can't load the payouts"
            detail={error.message}
            onRetry={() => setAttempt((n) => n + 1)}
          />
        ) : null}

        {!ready && !error && (
          <TabSkeleton shape="rows" label="Loading the payouts" />
        )}

        {ready && prizes.length === 0 && (
          <p className={styles.empty}>
            No prize has finished yet. Each one shows up here once its last week
            is final, with its winners and what they're owed.
          </p>
        )}

        {ready && prizes.length > 0 && (
          <>
            <section aria-label="Payout totals" className={rosterStyles.totals}>
              <Stat value={formatDollars(sum((t) => t.owed))} label="Owed" />
              <Stat value={formatDollars(sum((t) => t.paid))} label="Paid" />
              <Stat value={formatDollars(sum((t) => t.left))} label="Left" />
              <Stat
                value={`${sum((t) => t.paidInFull)} of ${sum((t) => t.winners)}`}
                label="Winners paid in full"
              />
            </section>
            {prizes.map((prize) => (
              <PrizeSection
                key={prize.period.key}
                prize={prize}
                paid={roster.payouts?.[prize.period.key]}
                entries={entries}
                editing={editing}
                saving={saving}
                saveError={saveError}
                onEdit={(id) => {
                  setSaveError(null);
                  setEditing(id);
                }}
                onSave={save(prize.period.key)}
              />
            ))}
            <span className={rosterStyles.caption}>
              What each winner is owed comes from the pool data on the prize's
              last week, with ties split the way the data splits them. Payouts
              are admin-only and never shown on public pages.
            </span>
          </>
        )}
      </div>
    </>
  );
}
