import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import { memo, useState } from "react";
import { PayPeriod, RankedUser } from "../../types";
import { useCurrentWeek } from "../CurrentWeekContext";
import { UserAvatar } from "../UserAvatar";
import { LeaderBoard, LeaderList, LeaderRow, leaderList } from "./leadersUtils";
import { MEDAL } from "./medals";
import { overallPeriod, periodName } from "../../utils/payPeriods";
import styles from "./SegmentLeaders.module.css";

type Props = {
  userList: RankedUser[];
  userId?: string;
  week: number;
  // The shown segment (shownSegment), never overall.
  segment: PayPeriod;
};

const Row = ({ row, selected }: { row: LeaderRow; selected: boolean }) => {
  const medal = MEDAL[row.place];
  return (
    <div className={selected ? `${styles.row} ${styles.selected}` : styles.row}>
      <div
        className={styles.place}
        style={medal && { backgroundColor: medal.bg, color: medal.fg }}
      >
        {row.placeLabel}
      </div>
      <div
        className={
          selected ? `${styles.name} ${styles.nameSelected}` : styles.name
        }
      >
        <UserAvatar
          userId={row.id}
          userName={row.name}
          size={20}
          fontSize="0.8125rem"
        />
      </div>
      <span className={styles.score}>
        {row.score}
        {row.covering > 0 && (
          <span
            title={`${row.covering} pick${row.covering === 1 ? "" : "s"} covering now`}
            className={styles.covering}
          >
            +{row.covering}
          </span>
        )}
      </span>
    </div>
  );
};

const Rows = ({ list, userId }: { list: LeaderList; userId?: string }) => (
  <div className={styles.rows}>
    {list.rows.map((row) => (
      <Row key={row.id} row={row} selected={row.id === userId} />
    ))}
    {list.youRow && (
      <>
        <p className={styles.gap}>···</p>
        <Row row={list.youRow} selected />
      </>
    )}
    <span className={`${styles.caption} ${styles.legend}`}>
      <span className={styles.green}>Green</span> = picks covering right now
    </span>
  </div>
);

const CardHead = ({ title, sub }: { title: string; sub: string }) => (
  <div className={styles.head}>
    <p className={styles.title}>{title}</p>
    <span className={styles.caption}>{sub}</span>
  </div>
);

// Overall and the shown segment's paid places (the 2nd half today), at the
// top of User Picks while a segment that didn't start with the season is
// being played. Two cards side by side; one card with tabs on phones.
// Memoized for the same reason as UsersTable: User Picks stays mounted.
const SegmentLeaders = memo(function SegmentLeaders({
  userList,
  userId,
  week,
  segment,
}: Props) {
  const { periods } = useCurrentWeek();
  const [tab, setTab] = useState<LeaderBoard>("overall");
  const overall = overallPeriod(periods);
  if (!userList.length || !overall) return null;

  const boards: {
    key: LeaderBoard;
    title: string;
    sub: string;
    list: LeaderList;
  }[] = [
    {
      key: "overall",
      title: "Overall",
      sub: `Week ${week} · top ${overall.paid_places} paid`,
      list: leaderList(userList, overall.key, overall.paid_places, userId),
    },
    {
      key: segment.key,
      title: periodName(segment),
      sub: `Since week ${segment.start_week} · top ${segment.paid_places} paid`,
      list: leaderList(userList, segment.key, segment.paid_places, userId),
    },
  ];
  const active = boards.find((b) => b.key === tab) ?? boards[0];

  return (
    <div className={styles.leaders}>
      <div className={styles.pair}>
        {boards.map((b) => (
          <div key={b.key} className={styles.card}>
            <CardHead title={b.title} sub={b.sub} />
            <Rows list={b.list} userId={userId} />
          </div>
        ))}
      </div>

      <div className={`${styles.card} ${styles.tabbed}`}>
        <Tabs
          value={tab}
          onChange={(_, v: LeaderBoard) => setTab(v)}
          sx={{ minHeight: 40, mb: 1, "& .MuiTab-root": { minHeight: 40 } }}
        >
          {boards.map((b) => (
            <Tab key={b.key} value={b.key} label={b.title} />
          ))}
        </Tabs>
        <span className={`${styles.caption} ${styles.sub}`}>{active.sub}</span>
        <Rows list={active.list} userId={userId} />
      </div>
    </div>
  );
});

export default SegmentLeaders;
