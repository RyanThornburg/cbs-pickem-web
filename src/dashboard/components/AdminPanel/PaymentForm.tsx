import { FormEvent, useState } from "react";
import { PaymentMethod, RosterPayment } from "../../types";
import { Button } from "../../ui/Button";
import { SelectField, TextField } from "./FormFields";
import { METHOD_LABEL, METHODS, todayIso } from "./rosterUtils";
import styles from "./RosterView.module.css";

// The edit row for one payment: an entry fee on Roster (whole dollars) or a
// prize payout on Payouts (dollars and cents). Amount, date, method and a
// note, the fields roster:{season} keeps.

type Draft = {
  amount: string;
  date: string;
  method: PaymentMethod | "";
  note: string;
};

const draftFrom = (
  payment: RosterPayment | null,
  defaultAmount: number | null
): Draft => ({
  amount: String(payment?.paid_amount ?? defaultAmount ?? ""),
  date: payment ? (payment.paid_at ?? "") : todayIso(),
  method: payment ? (payment.method ?? "") : "venmo",
  note: payment?.note ?? "",
});

const WHOLE = /^\d+$/;
const CENTS = /^\d+(\.\d{1,2})?$/;

export function PaymentForm({
  idBase,
  label,
  payment,
  defaultAmount,
  cents = false,
  saving,
  error,
  onSave,
  onClear,
  onCancel,
}: {
  idBase: string;
  // The form's accessible name: "Payment for Alex Rivera".
  label: string;
  payment: RosterPayment | null;
  // The amount a new record starts at: the fee, or what's owed.
  defaultAmount: number | null;
  cents?: boolean;
  saving: boolean;
  error: string | null;
  onSave: (payment: RosterPayment) => void;
  onClear: () => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(() => draftFrom(payment, defaultAmount));
  const trimmed = draft.amount.trim();
  const amountOk = (cents ? CENTS : WHOLE).test(trimmed);
  const set = (field: keyof Draft) => (value: string) =>
    setDraft((d) => ({ ...d, [field]: value }));
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!amountOk) return;
    onSave({
      paid_amount: Number(trimmed),
      paid_at: draft.date || null,
      method: draft.method || null,
      note: draft.note.trim() || null,
    });
  };
  return (
    <form onSubmit={submit} aria-label={label} className={styles.form}>
      <TextField
        id={`${idBase}-amount`}
        label="Amount ($)"
        type="number"
        value={draft.amount}
        onChange={set("amount")}
        error={!amountOk}
        helperText={
          amountOk ? undefined : cents ? "Dollars and cents" : "Whole dollars"
        }
        inputProps={{
          min: 0,
          step: cents ? 0.01 : 1,
          inputMode: cents ? "decimal" : "numeric",
        }}
        className={styles.amountField}
        autoFocus
      />
      <TextField
        id={`${idBase}-date`}
        label="Date"
        type="date"
        value={draft.date}
        onChange={set("date")}
        shrink
        className={styles.dateField}
      />
      <SelectField<PaymentMethod | "">
        id={`${idBase}-method`}
        label="Method"
        value={draft.method}
        onChange={set("method")}
        options={[
          { value: "", label: <em>Not set</em> },
          ...METHODS.map((m) => ({ value: m, label: METHOD_LABEL[m] })),
        ]}
        renderValue={(m) => (m === "" ? "" : METHOD_LABEL[m])}
        className={styles.methodField}
      />
      <TextField
        id={`${idBase}-note`}
        label="Note"
        value={draft.note}
        onChange={set("note")}
        placeholder="Optional"
        inputProps={{ maxLength: 200 }}
        className={styles.noteField}
      />
      <div className={styles.formButtons}>
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
        {payment && (
          <Button size="small" onClick={onClear} disabled={saving}>
            Mark unpaid
          </Button>
        )}
      </div>
      {error && (
        <p role="alert" className={styles.saveError}>
          Couldn't save: {error}. Nothing changed; try again.
        </p>
      )}
    </form>
  );
}
