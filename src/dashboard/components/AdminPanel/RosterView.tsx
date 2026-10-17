import {
  Box,
  Button,
  Checkbox,
  Chip,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import MailOutlineIcon from "@mui/icons-material/MailOutlined";
import { FormEvent, ReactNode, useEffect, useState } from "react";
import { AdminUnauthorizedError } from "../../data/GetAdminStatus";
import {
  GetRoster,
  RosterNotReadyError,
  SavePayment,
} from "../../data/GetRoster";
import { gray, green } from "../../shared-theme/themePrimitives";
import {
  PaymentMethod,
  Roster,
  RosterMember,
  RosterPayment,
} from "../../types";
import { formatUpdated } from "../../utils/updatedTime";
import { useCurrentWeek } from "../CurrentWeekContext";
import LoadError from "../shared/LoadError";
import { PlayerLink } from "../shared/PlayerLink";
import TabIntro from "../TabIntro";
import TabSkeleton from "../TabSkeleton";
import { LogoutButton } from "./AdminControls";
import {
  filterMembers,
  formatDollars,
  gmailComposeUrl,
  METHOD_LABEL,
  METHODS,
  paymentDetail,
  paymentStatus,
  RosterFilter,
  rosterTotals,
  todayIso,
} from "./rosterUtils";

// Admin › Roster: who's paid this season, and a Gmail draft to whoever's
// picked. Payments save to roster:{season} through the Worker; names and
// emails come from the pipeline's admin:users.

const FILTERS: { value: RosterFilter; label: string }[] = [
  { value: "unpaid", label: "Unpaid" },
  { value: "paid", label: "Paid" },
  { value: "all", label: "All" },
];

const Stat = ({ value, label }: { value: ReactNode; label: string }) => (
  <Box>
    <Typography
      sx={{
        fontSize: "1.75rem",
        fontWeight: 700,
        lineHeight: 1.2,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {value}
    </Typography>
    <Typography
      variant="caption"
      sx={{ color: "text.secondary", fontWeight: 500 }}
    >
      {label}
    </Typography>
  </Box>
);

const Totals = ({ roster }: { roster: Roster }) => {
  const fee = roster.entry_fee;
  const t = rosterTotals(roster.users, fee);
  return (
    <Box
      component="section"
      aria-label="Payment totals"
      sx={{
        display: "flex",
        flexWrap: "wrap",
        columnGap: 3,
        rowGap: 1.5,
        p: 2,
        borderRadius: 2,
        bgcolor: gray[50],
      }}
    >
      <Stat value={`${t.paid} of ${t.members}`} label="Paid in full" />
      <Stat value={formatDollars(t.collected)} label="Collected" />
      {t.owed !== null && (
        <Stat value={formatDollars(t.owed)} label="Still owed" />
      )}
      <Box sx={{ flex: "1 1 12rem", alignSelf: "center", minWidth: 0 }}>
        {t.pot !== null && (
          <Box
            role="presentation"
            sx={{
              height: 8,
              borderRadius: 999,
              bgcolor: gray[200],
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                height: "100%",
                width: `${Math.min(100, (t.collected / Math.max(1, t.pot)) * 100)}%`,
                bgcolor: green[600],
              }}
            />
          </Box>
        )}
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          {fee === null
            ? "No entry fee from the season settings yet, so nothing counts as owed."
            : `${formatDollars(t.collected)} of ${formatDollars(t.pot ?? 0)} · ${formatDollars(fee)} entry`}
        </Typography>
      </Box>
    </Box>
  );
};

const StatusChip = ({
  payment,
  fee,
}: {
  payment: RosterPayment | null;
  fee: number | null;
}) => {
  const status = paymentStatus(payment, fee);
  if (status.kind === "paid") {
    return (
      <Chip
        size="small"
        label="Paid"
        sx={{ bgcolor: green[50], color: green[800], fontWeight: 500 }}
      />
    );
  }
  return (
    <Chip
      size="small"
      label={
        status.kind === "partial"
          ? `Owes ${formatDollars(status.owed)}`
          : "Unpaid"
      }
    />
  );
};

type Draft = {
  amount: string;
  date: string;
  method: PaymentMethod | "";
  note: string;
};

const draftFrom = (
  payment: RosterPayment | null,
  fee: number | null
): Draft => ({
  amount: String(payment?.paid_amount ?? fee ?? ""),
  date: payment ? (payment.paid_at ?? "") : todayIso(),
  method: payment ? (payment.method ?? "") : "venmo",
  note: payment?.note ?? "",
});

const PaymentForm = ({
  member,
  fee,
  saving,
  error,
  onSave,
  onClear,
  onCancel,
}: {
  member: RosterMember;
  fee: number | null;
  saving: boolean;
  error: string | null;
  onSave: (payment: RosterPayment) => void;
  onClear: () => void;
  onCancel: () => void;
}) => {
  const [draft, setDraft] = useState(() => draftFrom(member.payment, fee));
  const amount = Number(draft.amount);
  const amountOk =
    draft.amount.trim() !== "" && Number.isInteger(amount) && amount >= 0;
  const set = (field: keyof Draft) => (e: { target: { value: string } }) =>
    setDraft((d) => ({ ...d, [field]: e.target.value }));
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!amountOk) return;
    onSave({
      paid_amount: amount,
      paid_at: draft.date || null,
      method: draft.method || null,
      note: draft.note.trim() || null,
    });
  };
  const idBase = `roster-${member.user_id}`;
  return (
    <Box
      component="form"
      onSubmit={submit}
      aria-label={`Payment for ${member.name}`}
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 1,
        alignItems: "flex-start",
      }}
    >
      <TextField
        id={`${idBase}-amount`}
        label="Amount ($)"
        size="small"
        type="number"
        value={draft.amount}
        onChange={set("amount")}
        error={!amountOk}
        helperText={amountOk ? undefined : "Whole dollars"}
        slotProps={{ htmlInput: { min: 0, step: 1, inputMode: "numeric" } }}
        sx={{ width: 120 }}
        autoFocus
      />
      <TextField
        id={`${idBase}-date`}
        label="Date"
        size="small"
        type="date"
        value={draft.date}
        onChange={set("date")}
        slotProps={{ inputLabel: { shrink: true } }}
        sx={{ width: 160 }}
      />
      <TextField
        id={`${idBase}-method`}
        label="Method"
        size="small"
        select
        value={draft.method}
        onChange={set("method")}
        sx={{ width: 140 }}
      >
        <MenuItem value="">
          <em>Not set</em>
        </MenuItem>
        {METHODS.map((m) => (
          <MenuItem key={m} value={m}>
            {METHOD_LABEL[m]}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        id={`${idBase}-note`}
        label="Note"
        size="small"
        value={draft.note}
        onChange={set("note")}
        placeholder="Optional"
        slotProps={{ htmlInput: { maxLength: 200 } }}
        sx={{ flex: "1 1 12rem", minWidth: 0 }}
      />
      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: "center", py: 0.25 }}
      >
        <Button
          type="submit"
          variant="contained"
          size="small"
          disabled={saving || !amountOk}
        >
          {saving ? "Saving…" : "Save"}
        </Button>
        <Button
          size="small"
          variant="outlined"
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </Button>
        {member.payment && (
          <Button size="small" onClick={onClear} disabled={saving}>
            Mark unpaid
          </Button>
        )}
      </Stack>
      {error && (
        <Typography
          role="alert"
          variant="body2"
          sx={{ width: "100%", color: "error.main" }}
        >
          Couldn't save: {error}. Nothing changed; try again.
        </Typography>
      )}
    </Box>
  );
};

export default function RosterView({ viewSwitch }: { viewSwitch: ReactNode }) {
  const { season } = useCurrentWeek();
  const [roster, setRoster] = useState<Roster | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [filter, setFilter] = useState<RosterFilter>("unpaid");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [editing, setEditing] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    GetRoster(season).then(
      (data) => {
        if (cancelled) return;
        setRoster(data);
        setError(null);
      },
      (err: Error) => !cancelled && setError(err)
    );
    return () => {
      cancelled = true;
    };
  }, [season, attempt]);

  const save = async (userId: number, payment: RosterPayment | null) => {
    setSaving(true);
    setSaveError(null);
    try {
      setRoster(await SavePayment(season, userId, payment));
      setEditing(null);
    } catch (err) {
      if (err instanceof AdminUnauthorizedError) setError(err);
      setSaveError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const fee = roster?.entry_fee ?? null;
  const shown = roster ? filterMembers(roster.users, filter, fee) : [];
  const selectable = shown.filter((u) => u.email);
  const allSelected =
    selectable.length > 0 && selectable.every((u) => selected.has(u.user_id));
  const emails = (roster?.users ?? [])
    .filter((u) => selected.has(u.user_id) && u.email)
    .map((u) => u.email as string);

  const toggle = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const changeFilter = (next: RosterFilter) => {
    setFilter(next);
    // Never email someone the filter has hidden.
    setSelected(new Set());
    setEditing(null);
  };

  const copyEmails = async () => {
    try {
      await navigator.clipboard.writeText(emails.join(", "));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const unauthorized = error instanceof AdminUnauthorizedError;

  return (
    <>
      <TabIntro
        title="Admin"
        meta={
          roster?.updated_at
            ? `Roster ${season} · saved ${formatUpdated(roster.updated_at)}`
            : `Roster ${season}`
        }
        actions={
          <Stack
            direction="row"
            spacing={1}
            useFlexGap
            sx={{ flexWrap: "wrap", alignItems: "center" }}
          >
            {viewSwitch}
            <LogoutButton />
          </Stack>
        }
      />
      <Stack spacing={2} sx={{ textAlign: "left" }}>
        {unauthorized ? (
          <LoadError
            title="Your admin session has expired or you're not signed in."
            detail="Sign in again to see or change the roster."
            actions={
              // Full page load so it goes back through the Access login.
              <Button variant="outlined" size="small" href="/admin?view=roster">
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
        ) : error && !roster ? (
          <LoadError
            title="Can't load the roster"
            detail={error.message}
            onRetry={() => setAttempt((n) => n + 1)}
          />
        ) : null}

        {!roster && !error && (
          <TabSkeleton shape="rows" label="Loading the roster" />
        )}

        {roster && (
          <>
            <Totals roster={roster} />

            <Stack
              direction="row"
              useFlexGap
              spacing={1}
              sx={{ flexWrap: "wrap", alignItems: "center" }}
            >
              <ToggleButtonGroup
                size="small"
                exclusive
                value={filter}
                onChange={(_e, value: RosterFilter | null) =>
                  value && changeFilter(value)
                }
                aria-label="Show members"
              >
                {FILTERS.map((f) => (
                  <ToggleButton key={f.value} value={f.value}>
                    {f.label} {filterMembers(roster.users, f.value, fee).length}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
              <Box sx={{ flex: 1 }} />
              <Button
                variant="outlined"
                startIcon={<ContentCopyIcon />}
                disabled={emails.length === 0}
                onClick={copyEmails}
              >
                {copied ? "Copied" : "Copy emails"}
              </Button>
              <Button
                // Outlined until someone's picked: the theme's disabled
                // contained button is dark text on a dark fill.
                variant={emails.length ? "contained" : "outlined"}
                startIcon={<MailOutlineIcon />}
                disabled={emails.length === 0}
                href={gmailComposeUrl(emails)}
                target="_blank"
                rel="noopener noreferrer"
              >
                {emails.length
                  ? `Email ${emails.length} in Gmail`
                  : "Email in Gmail"}
              </Button>
            </Stack>

            <TableContainer
              sx={{ border: 1, borderColor: "divider", borderRadius: 2 }}
            >
              <Table size="small" sx={{ fontVariantNumeric: "tabular-nums" }}>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={allSelected}
                        indeterminate={
                          !allSelected &&
                          selectable.some((u) => selected.has(u.user_id))
                        }
                        disabled={selectable.length === 0}
                        onChange={() =>
                          setSelected(
                            allSelected
                              ? new Set()
                              : new Set(selectable.map((u) => u.user_id))
                          )
                        }
                        slotProps={{
                          input: { "aria-label": "Select everyone shown" },
                        }}
                      />
                    </TableCell>
                    <TableCell>Member</TableCell>
                    <TableCell
                      sx={{ display: { xs: "none", md: "table-cell" } }}
                    >
                      Email
                    </TableCell>
                    <TableCell
                      sx={{ display: { xs: "none", sm: "table-cell" } }}
                    >
                      Status
                    </TableCell>
                    <TableCell
                      sx={{ display: { xs: "none", sm: "table-cell" } }}
                    >
                      Paid
                    </TableCell>
                    <TableCell>
                      <Box component="span" sx={visuallyHidden}>
                        Edit
                      </Box>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {shown.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        sx={{ color: "text.secondary", py: 2 }}
                      >
                        {filter === "unpaid"
                          ? "Everyone has paid in full."
                          : "No one here yet."}
                      </TableCell>
                    </TableRow>
                  )}
                  {shown.map((m) => {
                    const isSelected = selected.has(m.user_id);
                    return [
                      <TableRow key={m.user_id} selected={isSelected}>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={isSelected}
                            disabled={!m.email}
                            onChange={() => toggle(m.user_id)}
                            slotProps={{
                              input: { "aria-label": `Select ${m.name}` },
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ minWidth: 0 }}>
                          <PlayerLink
                            id={String(m.user_id)}
                            sx={{ fontWeight: 500 }}
                          >
                            {m.name}
                          </PlayerLink>
                          {/* Email, status and payment move under the name
                              where their columns are hidden. */}
                          <Typography
                            variant="caption"
                            sx={{
                              display: { xs: "block", md: "none" },
                              color: "text.secondary",
                              // Long addresses break only where they must.
                              overflowWrap: "anywhere",
                            }}
                          >
                            {m.email ?? "No email on file"}
                          </Typography>
                          {m.payment && (
                            <Typography
                              variant="caption"
                              sx={{
                                display: { xs: "block", sm: "none" },
                                color: "text.secondary",
                              }}
                            >
                              {paymentDetail(m.payment)}
                            </Typography>
                          )}
                          <Box
                            sx={{
                              display: { xs: "block", sm: "none" },
                              mt: 0.5,
                            }}
                          >
                            <StatusChip payment={m.payment} fee={fee} />
                          </Box>
                        </TableCell>
                        <TableCell
                          sx={{
                            display: { xs: "none", md: "table-cell" },
                            color: m.email ? "text.secondary" : "text.disabled",
                          }}
                        >
                          {m.email ?? "No email on file"}
                        </TableCell>
                        <TableCell
                          sx={{ display: { xs: "none", sm: "table-cell" } }}
                        >
                          <StatusChip payment={m.payment} fee={fee} />
                        </TableCell>
                        <TableCell
                          sx={{
                            display: { xs: "none", sm: "table-cell" },
                            color: "text.secondary",
                          }}
                        >
                          {m.payment ? paymentDetail(m.payment) : "–"}
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            onClick={() => {
                              setSaveError(null);
                              setEditing(
                                editing === m.user_id ? null : m.user_id
                              );
                            }}
                            aria-expanded={editing === m.user_id}
                            aria-label={`${m.payment ? "Edit payment" : "Mark paid"} for ${m.name}`}
                            sx={{ whiteSpace: "nowrap" }}
                          >
                            {m.payment ? "Edit" : "Mark paid"}
                          </Button>
                        </TableCell>
                      </TableRow>,
                      editing === m.user_id && (
                        <TableRow key={`${m.user_id}-edit`}>
                          <TableCell
                            colSpan={6}
                            sx={{ bgcolor: gray[50], py: 1.5 }}
                          >
                            <PaymentForm
                              member={m}
                              fee={fee}
                              saving={saving}
                              error={saveError}
                              onSave={(payment) => save(m.user_id, payment)}
                              onClear={() => save(m.user_id, null)}
                              onCancel={() => setEditing(null)}
                            />
                          </TableCell>
                        </TableRow>
                      ),
                    ];
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Active members from CBS, refreshed daily
              {roster.users_updated_at &&
                ` (last ${formatUpdated(roster.users_updated_at)})`}
              . Payments are admin-only and never shown on public pages. The
              Gmail draft puts everyone in BCC.
            </Typography>
          </>
        )}
      </Stack>
    </>
  );
}

const visuallyHidden = {
  position: "absolute",
  // Strings: in sx, a bare 1 means 100%.
  width: "1px",
  height: "1px",
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
} as const;
