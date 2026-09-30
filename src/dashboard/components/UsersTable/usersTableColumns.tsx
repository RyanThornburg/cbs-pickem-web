import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import ButtonBase from "@mui/material/ButtonBase";
import Stack from "@mui/material/Stack";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { RankedUser, RecapMove, UserSeasonTrends } from "../../types";
import { MoverBadge, PerfectWeekBadge } from "../Recap/PlayerBadges";
import UserAvatar from "../UserAvatar";
import { PlaceCell } from "./PlaceCell";
import { StreakBadge } from "./StreakBadge";
import { WeeklyFormIcon } from "./WeeklyFormIcon";
import { DefendingChampionBadge } from "./DefendingChampionBadge";
import { UserGamePicksStack } from "./UserPickStack";
import { SEASON_STREAK_MIN_WEEKS } from "./usersTableUtils";

export interface UsersTableRow {
  id: string;
  name: string;
  place: number | null;
  second_half_place: number | null;
  score: number;
  second_half_score: number;
  weekly_score: number;
  picks: RankedUser["picks"];
  streakWeeks: number;
  streakThresholdPct: number | undefined;
  defendingChampionSeason: number | null;
  // From this week's recap.
  move: RecapMove | undefined;
  perfectWeek: boolean;
}

export const toUsersTableRow = (
  user: RankedUser,
  trends: Record<string, UserSeasonTrends>,
  weekBadges: {
    move?: RecapMove;
    perfectWeek?: boolean;
    showStreak?: boolean;
  } = {}
): UsersTableRow => {
  const lastSeason = trends[user.id]?.career.trend?.last_season;

  return {
    id: user.id,
    name: user.name,
    place: user.place,
    second_half_place: user.second_half_place,
    score: user.cumulative_score + user.trending_score,
    second_half_score: (user.second_half_score ?? 0) + user.trending_score,
    weekly_score: user.weekly_score + user.trending_score,
    picks: user.picks,
    streakWeeks:
      weekBadges.showStreak === false
        ? 0
        : (trends[user.id]?.current_season.hot_streak.current_streak ?? 0),
    streakThresholdPct:
      trends[user.id]?.current_season.hot_streak.threshold_pct,
    defendingChampionSeason: lastSeason?.rank === 1 ? lastSeason.season : null,
    move: weekBadges.move,
    perfectWeek: weekBadges.perfectWeek ?? false,
  };
};

// Column defs shared by the desktop (plain MUI Table) and mobile variants so
// sorting/accessor logic lives in one place -- each variant still renders its
// own header/row markup (different widths, abbreviated mobile labels), just
// driven by the same table instance's column model. `mobileHeader` is read
// by UserDataMobile for its abbreviated column labels.
declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    mobileHeader?: string;
    align?: "left" | "center";
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TableMeta<TData> {
    expandedId: string | null;
    toggleExpanded: (id: string) => void;
  }
}

const columnHelper = createColumnHelper<UsersTableRow>();

const ExpandButton = ({
  name,
  userId,
  expanded,
  onToggle,
}: {
  name: string;
  userId: string;
  expanded: boolean;
  onToggle: () => void;
}) => (
  <ButtonBase
    aria-expanded={expanded}
    aria-label={`${name}: season trends`}
    onClick={(event) => {
      // The row's own click handler would toggle it straight back.
      event.stopPropagation();
      onToggle();
    }}
    sx={{
      gap: 0.25,
      minWidth: 0,
      maxWidth: "100%",
      borderRadius: 1,
      textAlign: "left",
    }}
  >
    <UserAvatar
      userName={name}
      userId={userId}
      fontSize="0.8125rem"
      size={26}
    />
    <ExpandMoreIcon
      aria-hidden
      sx={{
        fontSize: "1rem",
        flexShrink: 0,
        color: "text.secondary",
        transition: "transform 150ms ease-out",
        transform: expanded ? "rotate(180deg)" : "none",
      }}
    />
  </ButtonBase>
);

// Columns hold different value types, so TanStack's own docs type the array
// with `any` for the value.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const buildUsersTableColumns = (): ColumnDef<UsersTableRow, any>[] => [
  columnHelper.accessor("place", {
    header: "#",
    cell: (info) => <PlaceCell place={info.getValue()} />,
    meta: { align: "center" },
  }),
  columnHelper.accessor("second_half_place", {
    id: "second_half_place",
    header: "2nd Half Place",
    cell: (info) => <PlaceCell place={info.getValue()} />,
    meta: { mobileHeader: "2H Plc", align: "center" },
  }),
  columnHelper.accessor("name", {
    header: "Name",
    cell: (info) => {
      const row = info.row.original;
      const hasBadges =
        row.defendingChampionSeason != null ||
        row.streakWeeks >= SEASON_STREAK_MIN_WEEKS ||
        row.perfectWeek ||
        (row.move?.change ?? 0) !== 0;
      return (
        // On phones the badges wrap to a line under the name (indented past
        // the avatar) so they don't squeeze the name down to a letter.
        <Stack
          direction="row"
          sx={{
            alignItems: "center",
            flexWrap: { xs: "wrap", sm: "nowrap" },
            columnGap: 1,
            rowGap: 0.25,
          }}
        >
          {/* The whole row also toggles on click; this button is the
              keyboard and screen-reader way in, and the chevron shows
              sighted users that rows open. */}
          <ExpandButton
            name={info.getValue()}
            userId={row.id}
            expanded={info.table.options.meta?.expandedId === row.id}
            onToggle={() => info.table.options.meta?.toggleExpanded(row.id)}
          />
          {hasBadges && (
            <Stack
              direction="row"
              sx={{
                alignItems: "center",
                width: { xs: "100%", sm: "auto" },
                pl: { xs: "32px", sm: 0 },
                flexWrap: { xs: "wrap", sm: "nowrap" },
                gap: 0.75,
              }}
            >
              {/* Most common first, so each badge lands in a predictable spot. */}
              <MoverBadge move={row.move} />
              <StreakBadge
                weeks={row.streakWeeks}
                thresholdPct={row.streakThresholdPct}
              />
              <PerfectWeekBadge perfect={row.perfectWeek} />
              <DefendingChampionBadge season={row.defendingChampionSeason} />
            </Stack>
          )}
        </Stack>
      );
    },
  }),
  columnHelper.accessor("score", {
    header: "Score",
    meta: { align: "center" },
  }),
  columnHelper.accessor("second_half_score", {
    id: "second_half_score",
    header: "2nd Half",
    meta: { mobileHeader: "2H", align: "center" },
  }),
  columnHelper.accessor("weekly_score", {
    header: "Week",
    cell: (info) => (
      <Stack
        direction="row"
        spacing={0.75}
        sx={{
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span>{info.getValue()}</span>
        <WeeklyFormIcon picks={info.row.original.picks} />
      </Stack>
    ),
    meta: { mobileHeader: "Wk", align: "center" },
  }),
  columnHelper.accessor("picks", {
    header: "Picks",
    cell: (info) => UserGamePicksStack(info.getValue()),
    enableSorting: false,
  }),
];
