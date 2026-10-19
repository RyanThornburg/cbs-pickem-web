import IconButton from "@mui/material/IconButton";
import { Icon } from "../../ui/Icon";
import { Popover } from "../../ui/Popover";
import { useCurrentWeek } from "../CurrentWeekContext";
import { MONEY_GOLD } from "./StandingsStatus";
import { periodName, periodWeeksText } from "../../utils/payPeriods";
import styles from "./PrizesHelp.module.css";

// How scoring and the prizes work, opened from the "?" on each paid line.
// The prize periods come from meta, so the text follows the season's
// settings. CBS lines are always half points, so there are no
// pushes to explain.
export function PrizesHelp() {
  const { periods } = useCurrentWeek();
  const prizes = periods.map(
    (period) =>
      [
        period.key,
        periodName(period),
        periodWeeksText(period),
        period.paid_places,
      ] as const
  );

  return (
    <Popover
      label="How prizes work"
      align="end"
      className={styles.popup}
      trigger={
        <IconButton
          size="small"
          aria-label="How prizes work"
          sx={{ width: 24, height: 24, my: -0.5, color: MONEY_GOLD }}
        >
          <Icon name="HelpOutlineOutlined" className={styles.icon} />
        </IconButton>
      }
    >
      <h4 className={styles.title}>How prizes work</h4>
      <p className={styles.text}>
        Every pick that covers the CBS line is 1 point.
      </p>
      <dl className={styles.prizes}>
        {prizes.map(([key, name, span, places]) => (
          <div key={key} className={styles.prize}>
            <dt className={styles.prizeName}>{name}</dt>
            <dd className={styles.prizeTerms}>
              {span} · top {places} paid
            </dd>
          </div>
        ))}
      </dl>
      <p className={styles.footnote}>
        The dashed lines mark the last paid place. Players tied at a paid place
        split its prize.
      </p>
    </Popover>
  );
}
