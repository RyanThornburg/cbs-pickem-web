import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutlineOutlined";
import { RankedUser } from "../../types";
import { useCurrentWeek } from "../CurrentWeekContext";
import { LeaderboardStatus } from "../useWeekData";
import { MoneyStanding, moneyStandings } from "./usersTableUtils";

// Deep trophy gold for text: 5.1:1 on white (DESIGN.md's #a87f12 was 3.7:1).
export const MONEY_GOLD = "#8a6a0f";

const timeFormat = new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
  minute: "2-digit",
});

const pts = (n: number) => `${n} pt${n === 1 ? "" : "s"}`;

function StandingPart({ standing }: { standing: MoneyStanding }) {
  return (
    <Box component="span" sx={{ whiteSpace: "nowrap" }}>
      {standing.prize}{" "}
      <Box component="span" sx={{ color: "text.secondary" }}>
        (top {standing.cutoff})
      </Box>
      :{" "}
      {standing.inMoney ? (
        <Box component="span" sx={{ color: MONEY_GOLD, fontWeight: 600 }}>
          in the money
        </Box>
      ) : (
        <Box component="span" sx={{ fontWeight: 600 }}>
          {pts(standing.ptsOut)} out of the money
        </Box>
      )}
    </Box>
  );
}

// The line above the table: where the selected player stands against each
// prize being played for (PRODUCT.md's job #1, which the table only shows
// as a gold line you have to scroll to), and when the standings last
// refreshed, or that the last refresh failed.
export function StandingsStatusLine({
  userList,
  userId,
  showSecondHalf,
  leaderboardStatus,
}: {
  userList: RankedUser[];
  userId: string;
  showSecondHalf: boolean;
  leaderboardStatus: LeaderboardStatus;
}) {
  const { paidPlaces } = useCurrentWeek();
  const standings = userId
    ? moneyStandings(
        userList.map((user) => ({
          id: user.id,
          place: user.place,
          second_half_place: user.second_half_place,
          score: user.cumulative_score + user.trending_score,
          second_half_score:
            (user.second_half_score ?? 0) + user.trending_score,
        })),
        userId,
        paidPlaces,
        showSecondHalf
      )
    : [];
  const { updatedAt, failed } = leaderboardStatus;

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "baseline",
        columnGap: 2,
        rowGap: 0.5,
        mb: 1,
        px: { xs: 0.5, sm: 2 },
        textAlign: "left",
      }}
    >
      {standings.length > 0 && (
        <Typography
          variant="body2"
          sx={{ display: "flex", flexWrap: "wrap", columnGap: 1.5 }}
        >
          <Box component="span" sx={{ fontWeight: 600 }}>
            You
          </Box>
          {standings.map((standing) => (
            <StandingPart key={standing.prize} standing={standing} />
          ))}
        </Typography>
      )}
      {updatedAt && (
        <Typography
          variant="caption"
          sx={{
            ml: "auto",
            color: "text.secondary",
            display: "inline-flex",
            alignItems: "center",
            gap: 0.5,
          }}
        >
          {failed && (
            <ErrorOutlineIcon aria-hidden sx={{ fontSize: "0.9rem" }} />
          )}
          {failed
            ? `Couldn't refresh. Showing ${timeFormat.format(updatedAt)}, trying again every minute.`
            : `Updated ${timeFormat.format(updatedAt)}`}
        </Typography>
      )}
    </Box>
  );
}

// What User Picks shows before there's a table: skeleton rows while the
// week loads, a retrying error when it can't, and an empty note when the
// week loaded with nobody in it. Never a blank tab.
export function StandingsPlaceholder({
  week,
  leaderboardStatus,
}: {
  week: number;
  leaderboardStatus: LeaderboardStatus;
}) {
  const { updatedAt, failed } = leaderboardStatus;

  if (failed || updatedAt) {
    return (
      <Box
        role="status"
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          p: 2,
          border: 1,
          borderColor: "divider",
          borderRadius: 2,
          textAlign: "left",
        }}
      >
        {failed && (
          <ErrorOutlineIcon aria-hidden sx={{ color: "text.secondary" }} />
        )}
        <Typography variant="body2">
          {failed
            ? `Couldn't load the week ${week} standings. Trying again every minute.`
            : `No standings for week ${week} yet.`}
        </Typography>
      </Box>
    );
  }

  return (
    <Box aria-busy="true" aria-label={`Loading the week ${week} standings`}>
      {Array.from({ length: 8 }, (_, i) => (
        <Box
          key={i}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            py: 1,
            px: { xs: 0.5, sm: 2 },
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Skeleton variant="text" width={20} />
          <Skeleton variant="circular" width={26} height={26} />
          <Skeleton variant="text" sx={{ flex: "0 1 10rem" }} />
          <Skeleton
            variant="rounded"
            height={24}
            sx={{ flex: "1 1 auto", maxWidth: 380, ml: "auto" }}
          />
        </Box>
      ))}
    </Box>
  );
}
