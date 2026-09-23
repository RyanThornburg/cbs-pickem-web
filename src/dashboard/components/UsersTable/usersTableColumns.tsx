import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import Stack from "@mui/material/Stack";
import { RankedUser, UserSeasonTrends } from "../../types";
import UserAvatar from "../UserAvatar";
import { PlaceCell } from "./PlaceCell";
import { StreakBadge } from "./StreakBadge";
import { WeeklyFormIcon } from "./WeeklyFormIcon";
import { DefendingChampionBadge } from "./DefendingChampionBadge";
import { UserGamePicksStack } from "./UserPickStack";

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
  defendingChampionSeason: number | null;
}

export const toUsersTableRow = (
  user: RankedUser,
  trends: Record<string, UserSeasonTrends>
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
    streakWeeks: trends[user.id]?.current_season.hot_streak.current_streak ?? 0,
    defendingChampionSeason: lastSeason?.rank === 1 ? lastSeason.season : null,
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
}

const columnHelper = createColumnHelper<UsersTableRow>();

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
    cell: (info) => (
      <Stack direction="row" alignItems="center" spacing={1}>
        <UserAvatar
          userName={info.getValue()}
          userId={info.row.original.id}
          fontSize="0.8125rem"
          size={26}
        />
        <DefendingChampionBadge season={info.row.original.defendingChampionSeason} />
        <StreakBadge weeks={info.row.original.streakWeeks} />
      </Stack>
    ),
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
      <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.75}>
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
