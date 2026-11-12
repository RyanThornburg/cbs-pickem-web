import { memo } from "react";
import { ordinal } from "../../helper";
import { PayPeriod, RankedUser } from "../../types";
import { useCurrentWeek } from "../CurrentWeekContext";
import {
  overallPeriod,
  periodName,
  periodWeeksLeft,
} from "../../utils/payPeriods";
import { Popover } from "../../ui/Popover";
import uiStyles from "../../ui/ui.module.css";
import { ScoreWithCovering } from "../UsersTable/ScoreWithCovering";
import { MONEY_GOLD } from "../UsersTable/StandingsStatus";
import { pts } from "../UsersTable/MoneyLines";
import { MEDAL } from "./medals";
import { RaceSummary, raceSummary, shortName } from "./leadersUtils";
import styles from "./SegmentLeaders.module.css";

type Props = {
  userList: RankedUser[];
  userId?: string;
  week: number;
  weekComplete: boolean;
  // The shown segment (shownSegment), never overall.
  segment: PayPeriod;
};

interface Race {
  period: PayPeriod;
  summary: RaceSummary;
  weeksLeft: number;
}

const weeksLeftText = (n: number) =>
  n === 0 ? "final" : `${n} wk${n === 1 ? "" : "s"} left`;

// Everyone tied for 1st, behind a tap: "4 tied" lists the four.
function TieButton({ race, text }: { race: Race; text: string }) {
  return (
    <Popover
      label={`Tied for 1st in the ${periodName(race.period)}`}
      className={styles.tiePopup}
      trigger={
        <button type="button" className={styles.tieButton}>
          {text}
        </button>
      }
    >
      <p className={styles.tieTitle}>
        Tied for 1st · {periodName(race.period)}
      </p>
      <ul className={styles.tieList}>
        {race.summary.leaders.map((l) => (
          <li key={l.id}>{l.name}</li>
        ))}
      </ul>
    </Popover>
  );
}

// "Phil Hedges", "P. Madden, P. Hedges", or "4 tied" (names on a tap).
function LeaderName({ race, compact }: { race: Race; compact?: boolean }) {
  const leaders = race.summary.leaders;
  if (!race.summary.started) {
    return <TieButton race={race} text="Everyone tied" />;
  }
  if (leaders.length === 1) {
    return <>{compact ? shortName(leaders[0].name) : leaders[0].name}</>;
  }
  if (leaders.length === 2 && !compact) {
    return <>{leaders.map((l) => shortName(l.name)).join(", ")}</>;
  }
  return <TieButton race={race} text={`${leaders.length} tied`} />;
}

function LeaderScore({ race }: { race: Race }) {
  const leader = race.summary.leaders[0];
  if (!leader) return null;
  // Tied leaders can split their points differently between settled and
  // covering; the "+N" only shows when there's one leader.
  const covering = race.summary.leaders.length === 1 ? leader.covering : 0;
  return (
    <span className={styles.big}>
      <ScoreWithCovering total={leader.score + covering} covering={covering} />
    </span>
  );
}

// "In the money · 3 pts clear" or "2 pts out".
function YouStatus({ race }: { race: Race }) {
  const you = race.summary.you!;
  if (you.inMoney) {
    return (
      <>
        <span className={styles.strong} style={{ color: MONEY_GOLD }}>
          In the money
        </span>
        {you.ptsClear !== null && you.ptsClear > 0 && (
          <span className={styles.muted}> · {pts(you.ptsClear)} clear</span>
        )}
      </>
    );
  }
  return <span className={styles.strong}>{pts(you.ptsOut)} out</span>;
}

function PlaceBadge({ place, label }: { place: number; label: string }) {
  const medal = MEDAL[place];
  return (
    <span
      className={styles.place}
      style={medal && { backgroundColor: medal.bg, color: medal.fg }}
    >
      {label}
    </span>
  );
}

// Desktop (sm and up): one row per prize under column heads.
function RaceTable({
  races,
  firstName,
}: {
  races: Race[];
  firstName?: string;
}) {
  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th scope="col" className={styles.head}>
            <span className={uiStyles.visuallyHidden}>Prize</span>
          </th>
          <th scope="col" className={styles.head}>
            Leader
          </th>
          <th scope="col" className={styles.head}>
            Paid line
          </th>
          {firstName && (
            <th scope="col" className={styles.head}>
              {firstName}
            </th>
          )}
        </tr>
      </thead>
      <tbody>
        {races.map((race) => {
          const { summary } = race;
          const you = summary.you;
          return (
            <tr key={race.period.key} className={styles.row}>
              <th scope="row" className={styles.prizeCell}>
                <span className={styles.prizeName}>
                  {periodName(race.period)}
                </span>
                <span className={styles.caption}>
                  Top {summary.paid} paid ·{" "}
                  {summary.started
                    ? weeksLeftText(race.weeksLeft)
                    : "starts this week"}
                </span>
              </th>
              <td className={styles.cell}>
                <span className={styles.leader}>
                  {summary.started && (
                    <PlaceBadge
                      place={1}
                      label={summary.leaders.length > 1 ? "T1" : "1"}
                    />
                  )}
                  <span className={styles.leaderName}>
                    <LeaderName race={race} />
                  </span>
                  {summary.started ? (
                    <LeaderScore race={race} />
                  ) : (
                    <span className={styles.big}>0</span>
                  )}
                </span>
              </td>
              <td className={styles.cell}>
                {summary.started ? (
                  <span className={styles.line}>
                    <span className={styles.big}>{summary.paidLine}</span>
                    <span className={styles.muted}>
                      {summary.inMoney > summary.paid
                        ? `${summary.inMoney} players in`
                        : `${ordinal(summary.paid)} place`}
                    </span>
                  </span>
                ) : (
                  <span className={styles.faint}>–</span>
                )}
              </td>
              {firstName && (
                <td className={styles.cell}>
                  {!you ? (
                    <span className={styles.faint}>–</span>
                  ) : !summary.started ? (
                    <span className={styles.muted}>Everyone's at 0</span>
                  ) : (
                    <span className={styles.youPill}>
                      <PlaceBadge place={you.place} label={you.placeLabel} />
                      <span className={styles.youScore}>
                        <ScoreWithCovering
                          total={you.score + you.covering}
                          covering={you.covering}
                        />
                      </span>
                      <span className={styles.youStatus}>
                        <YouStatus race={race} />
                      </span>
                    </span>
                  )}
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// Phones: each prize in two lines, both prizes at once.
function RaceList({ races, firstName }: { races: Race[]; firstName?: string }) {
  return (
    <ul className={styles.list}>
      {races.map((race) => {
        const { summary } = race;
        const you = summary.you;
        return (
          <li key={race.period.key} className={styles.item}>
            <div className={styles.line1}>
              <span className={styles.prizeName}>
                {periodName(race.period)}
              </span>
              <span className={styles.caption}>top {summary.paid}</span>
              <span className={styles.leaderRight}>
                <span className={styles.leaderName}>
                  <LeaderName race={race} compact />
                </span>
                {summary.started ? (
                  <LeaderScore race={race} />
                ) : (
                  <span className={styles.big}>0</span>
                )}
              </span>
            </div>
            <p className={styles.line2}>
              {!summary.started ? (
                <>Starts this week · {weeksLeftText(race.weeksLeft)}</>
              ) : (
                <>
                  Paid line{" "}
                  <span className={styles.strongInk}>{summary.paidLine}</span>
                  {you && firstName ? (
                    <>
                      {" · "}
                      <span className={styles.youBit}>
                        {firstName} {you.placeLabel} ·{" "}
                        {you.score + you.covering}
                      </span>{" "}
                      <YouStatus race={race} />
                    </>
                  ) : (
                    <> · {weeksLeftText(race.weeksLeft)}</>
                  )}
                </>
              )}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

// The prize race at the top of User Picks while a segment that didn't start
// with the season is being played (the 2nd half from week 10): for Overall
// and that segment, who leads, the score the last paid place has, and how
// far the selected player is from it. It replaced two cards listing the
// paid places by name, which repeated the table below and, in the 2nd
// half's first week, listed everyone (all tied at 0). Memoized for the same
// reason as UsersTable: User Picks stays mounted.
const SegmentLeaders = memo(function SegmentLeaders({
  userList,
  userId,
  week,
  weekComplete,
  segment,
}: Props) {
  const { periods } = useCurrentWeek();
  const overall = overallPeriod(periods);
  if (!userList.length || !overall) return null;

  const races: Race[] = [overall, segment].map((period) => ({
    period,
    summary: raceSummary(userList, period, periods, week, userId),
    weeksLeft: periodWeeksLeft(period, week, weekComplete),
  }));
  const selected = userId ? userList.find((u) => u.id === userId) : undefined;
  const firstName = selected?.name.trim().split(/\s+/)[0];

  return (
    <section aria-label="Prize race" className={styles.race}>
      <div className={styles.desktop}>
        <RaceTable races={races} firstName={firstName} />
      </div>
      <div className={styles.phone}>
        <RaceList races={races} firstName={firstName} />
      </div>
    </section>
  );
});

export default SegmentLeaders;
