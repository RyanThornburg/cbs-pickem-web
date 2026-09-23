import { ReactNode } from "react";
import Box from "@mui/material/Box";
import { Grid2 as Grid } from "@mui/material";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingFlatIcon from "@mui/icons-material/TrendingFlat";
import BalanceIcon from "@mui/icons-material/Balance";
import SentimentVeryDissatisfiedIcon from "@mui/icons-material/SentimentVeryDissatisfied";
import SentimentVerySatisfiedIcon from "@mui/icons-material/SentimentVerySatisfied";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import { PickBias, SpotTeam, UserSeasonTrends, VolumeWeightedTeam } from "../../types";
import { PICK_BIAS_MIN_PCT, PICK_BIAS_MIN_PICKS } from "./usersTableUtils";

const trendIcon = (direction: string) => {
  if (direction === "improving") return <TrendingUpIcon fontSize="small" color="success" />;
  if (direction === "declining") return <TrendingDownIcon fontSize="small" color="error" />;
  return <TrendingFlatIcon fontSize="small" color="disabled" />;
};

// Both prior_season and last_season are past, CLOSED seasons -- neither one
// is the user's current standing (that's current_season.current_rank,
// shown elsewhere as the Place column). Anchor both numbers to their actual
// years so this can't be misread as "currently in Nth."
const careerTrendText = (trends: UserSeasonTrends): string => {
  const trend = trends.career.trend;
  if (!trend || !trend.last_season || !trend.prior_season) {
    return "Not enough season history yet.";
  }
  const { direction, prior_season, last_season } = trend;

  if (direction === "same") {
    return `Finished ${last_season.rank}${ordinal(last_season.rank)} in ${last_season.season}, same as ${
      prior_season.season
    }.`;
  }
  const verb = direction === "improving" ? "Climbed" : "Fell";
  return `${verb} from ${prior_season.rank}${ordinal(prior_season.rank)} in ${prior_season.season} to ${
    last_season.rank
  }${ordinal(last_season.rank)} in ${last_season.season}.`;
};

// best_finish is 0 (falsy) for a user with no closed prior seasons, per the
// data repo's schema doc -- not just "worse than 10th", genuinely no data.
// Still gated on a top-10 best_finish (so a 23rd-place career doesn't get a
// card), but the card itself lists every top-5 season individually rather
// than just the single best rank -- otherwise a user who finished 1st once
// and 2nd another year only ever showed the 1st, with the 2nd invisible.
const bestFinishSummary = (
  trends: UserSeasonTrends
): { label: string; value: string } | null => {
  const { best_finish, best_finish_years, season_history } = trends.career;
  if (!best_finish || best_finish > 10) return null;

  const topFive = season_history.filter((entry) => entry.rank <= 5);
  if (topFive.length <= 1) {
    return {
      label: "Best finish",
      value: `${best_finish}${ordinal(best_finish)} place (${best_finish_years.join(", ")})`,
    };
  }

  // Grouped by rank (best first), years within a rank most-recent-first --
  // e.g. "1st (2020), 2nd (2025, 2023, 2015), 3rd (2013), 4th (2017)".
  const yearsByRank = new Map<number, number[]>();
  topFive.forEach((entry) => {
    const years = yearsByRank.get(entry.rank) ?? [];
    years.push(entry.season);
    yearsByRank.set(entry.rank, years);
  });

  const value = Array.from(yearsByRank.entries())
    .sort(([rankA], [rankB]) => rankA - rankB)
    .map(([rank, years]) => `${rank}${ordinal(rank)} (${years.sort((a, b) => b - a).join(", ")})`)
    .join(", ");

  return { label: "Top finishes", value };
};

const ordinal = (n: number): string => {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return "th";
  switch (n % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
};

const PICK_BIAS_LABELS: Record<keyof PickBias, string> = {
  favorite: "the favorite",
  underdog: "the underdog",
  home: "home teams",
  away: "away teams",
};

// pick_bias splits into two independent axes -- home/away and
// favorite/underdog -- each pair summing to ~1 (favorite/underdog excludes
// pick'em games, so not exactly). Report whichever axis has the more
// lopsided season-wide split, using pct rather than current_streak so there's
// no implied ordering.
const strongestPickLean = (bias: PickBias): { label: string; pct: number } | null => {
  const axes: Array<[keyof PickBias, keyof PickBias]> = [
    ["home", "away"],
    ["favorite", "underdog"],
  ];

  const leans = axes.map(([a, b]) => {
    const side = bias[a].pct >= bias[b].pct ? a : b;
    return { key: side, pct: Math.max(bias[a].pct, bias[b].pct), picks: bias[a].picks };
  });

  const best = leans
    .filter((lean) => lean.picks >= PICK_BIAS_MIN_PICKS && lean.pct >= PICK_BIAS_MIN_PCT)
    .sort((a, b) => b.pct - a.pct)[0];

  if (!best) return null;
  return { label: PICK_BIAS_LABELS[best.key], pct: best.pct };
};

// trap_team/lucky_team ("picks for this team only", replaced the pure-rate
// nemesis_team/lucky_team pair 2026-09-23 -- a team picked twice and lost
// twice used to rank the same as one picked ten times and lost eight).
// Shared formatter since both are volume-weighted the same way, just
// opposite direction.
const volumeWeightedTeamText = (entry: VolumeWeightedTeam): string => {
  const pct = Math.round(entry.pct_of_picks * 100);
  return `${entry.wins}-${entry.losses} picking the ${entry.team.name} (${pct}% of all picks)`;
};

// blind_spot_team/sweet_spot_team ("either side of the matchup", added
// 2026-09-23) -- picking team P and fading P's opponent are the same real
// bet, so every graded pick counts toward both teams' tallies at once.
// Different question from trap/lucky ("stop picking FOR this team"): this is
// "stop picking this team's games AT ALL, either way."
const spotTeamText = (entry: SpotTeam): string => {
  const pct = Math.round(entry.accuracy * 100);
  return `${pct}% correct on ${entry.team.name} games (${entry.picks} picks, either side)`;
};

interface TrendCardProps {
  icon: ReactNode;
  label: string;
  value: string;
}

function TrendCard({ icon, label, value }: TrendCardProps) {
  return (
    <Paper
      variant="outlined"
      sx={{ p: 1.5, display: "flex", gap: 1.25, alignItems: "flex-start", height: "100%" }}
    >
      <Box sx={{ mt: 0.25 }}>{icon}</Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="caption"
          sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4, color: "text.secondary" }}
        >
          {label}
        </Typography>
        <Typography variant="body2">{value}</Typography>
      </Box>
    </Paper>
  );
}

interface UserTrendPanelProps {
  trends: UserSeasonTrends | undefined;
}

export function UserTrendPanel({ trends }: UserTrendPanelProps) {
  if (!trends) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ p: 1.5 }}>
        Season trends aren't available for this user yet.
      </Typography>
    );
  }

  const bias = strongestPickLean(trends.current_season.pick_bias);
  const bestFinish = bestFinishSummary(trends);

  // Each of the four is independently guarded server-side (null unless it
  // actually holds), so a given user might show none, one, a matching pair,
  // or all four -- render only whichever are populated rather than padding
  // the panel with "no data" placeholders.
  const { trap_team, lucky_team, blind_spot_team, sweet_spot_team } = trends.current_season;

  // blind_spot_team/sweet_spot_team count picks on EITHER side of a team's
  // games. When a user has only ever picked a team's own side (never faded
  // its opponent), the either-side tally is identical to the for-this-team-
  // only tally -- same team, same pick count -- so the spot card would just
  // repeat the trap/lucky card's numbers. Drop the redundant spot card in
  // that case rather than show the same data twice.
  const isRedundantSpot = (bad: VolumeWeightedTeam | null, spot: SpotTeam | null): boolean =>
    !!bad && !!spot && bad.team.id === spot.team.id && bad.wins + bad.losses === spot.picks;

  const showBlindSpot = blind_spot_team && !isRedundantSpot(trap_team, blind_spot_team);
  const showSweetSpot = sweet_spot_team && !isRedundantSpot(lucky_team, sweet_spot_team);

  const matchupCards: TrendCardProps[] = [];
  if (trap_team) {
    matchupCards.push({
      icon: <SentimentVeryDissatisfiedIcon fontSize="small" color="error" />,
      label: "Trap team",
      value: volumeWeightedTeamText(trap_team),
    });
  }
  if (lucky_team) {
    matchupCards.push({
      icon: <SentimentVerySatisfiedIcon fontSize="small" color="success" />,
      label: "Lucky team",
      value: volumeWeightedTeamText(lucky_team),
    });
  }
  if (showBlindSpot) {
    matchupCards.push({
      icon: <VisibilityOffIcon fontSize="small" color="error" />,
      label: "Blind spot team",
      value: spotTeamText(blind_spot_team as SpotTeam),
    });
  }
  if (showSweetSpot) {
    matchupCards.push({
      icon: <VisibilityIcon fontSize="small" color="success" />,
      label: "Sweet spot team",
      value: spotTeamText(sweet_spot_team as SpotTeam),
    });
  }

  return (
    <Stack sx={{ p: { xs: 1, sm: 1.5 } }}>
      <Grid container spacing={1.25}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TrendCard
            icon={trendIcon(trends.career.trend?.direction ?? "same")}
            label="Career trend"
            value={careerTrendText(trends)}
          />
        </Grid>
        {bestFinish && (
          <Grid size={{ xs: 12, sm: 6 }}>
            <TrendCard
              icon={<EmojiEventsIcon fontSize="small" htmlColor="#d4a017" />}
              label={bestFinish.label}
              value={bestFinish.value}
            />
          </Grid>
        )}
        <Grid size={{ xs: 12, sm: 6 }}>
          <TrendCard
            icon={<BalanceIcon fontSize="small" color="action" />}
            label="Pick tendency"
            value={
              bias
                ? `${Math.round(bias.pct * 100)}% of this season's picks have favored ${
                    bias.label
                  }.`
                : "No strong pick lean this season."
            }
          />
        </Grid>
        {matchupCards.map((card) => (
          <Grid key={card.label} size={{ xs: 12, sm: 6 }}>
            <TrendCard {...card} />
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}
