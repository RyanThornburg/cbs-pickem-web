import { fetchJson, poll } from "../../api/pickemApi";
import { GameStatus, RankedUser, UserPick } from "../types";
import {
  ApiJoinGame,
  buildGamesById,
  fetchWeekGames,
  findEarliestGame,
  toTeam,
} from "./weekGames";

const POLL_INTERVAL_MS = 60_000;
const REQUIRED_PICKS_PER_WEEK = 5;

interface ApiLeaderboardPick {
  game_id: number;
  team_id: number;
  is_correct: boolean | null;
  trending_status?: string;
}

interface ApiLeaderboardUser {
  user_id: number;
  name: string;
  weekly_score: number;
  trending_score: number;
  cumulative_score: number;
  place: number;
  second_half_score: number | null;
  second_half_place: number | null;
  has_submitted_picks?: boolean;
  picks: ApiLeaderboardPick[];
}

interface ApiLeaderboardResponse {
  week: number;
  second_half_start_week: number;
  users: ApiLeaderboardUser[];
}

const fetchLeaderboard = (
  season: number,
  week: number
): Promise<ApiLeaderboardResponse> =>
  fetchJson<ApiLeaderboardResponse>(`/api/weeks/${season}/${week}/leaderboard`);

// The API's own place/second_half_place rank on cumulative_score alone and don't
// account for trending_score -- but the score shown in the UI is
// cumulative_score + trending_score (see LeaderboardCard's getScore), so a user
// with a trending bonus can display the same total as 1st place while the API
// ranks them lower. Re-rank client-side against the score actually displayed,
// using standard competition ranking (ties share a rank; the next rank skips
// accordingly), matching the pre-migration Firebase implementation.
const rankByScore = (
  users: ApiLeaderboardUser[],
  scoreOf: (user: ApiLeaderboardUser) => number | null
): Map<number, number | null> => {
  const ranked = users
    .map((user) => ({ user_id: user.user_id, score: scoreOf(user) }))
    .filter((entry): entry is { user_id: number; score: number } => entry.score !== null)
    .sort((a, b) => b.score - a.score);

  const ranks = new Map<number, number | null>();
  let rank = 0;
  let prevScore: number | null = null;
  ranked.forEach(({ user_id, score }, index) => {
    if (score !== prevScore) {
      rank = index + 1;
      prevScore = score;
    }
    ranks.set(user_id, rank);
  });

  return ranks;
};

const compareUsers = (a: RankedUser, b: RankedUser): number => {
  if (a.place !== b.place) {
    return a.place - b.place;
  }

  const aSecondHalf = a.second_half_place ?? 0;
  const bSecondHalf = b.second_half_place ?? 0;
  if (aSecondHalf !== bSecondHalf) {
    return aSecondHalf - bSecondHalf;
  }

  return a.name.toUpperCase().localeCompare(b.name.toUpperCase());
};

// Picks lock and reveal together for the whole week (at the first kickoff), not
// game-by-game -- otherwise someone with an early bye-week-ish game still shows TBD
// for it after everyone's picks are already public.
const isWeekLocked = (games: ApiJoinGame[]): boolean => {
  const earliest = findEarliestGame(games);
  return earliest !== undefined && earliest.status !== GameStatus.Scheduled;
};

const joinPick = (
  pick: ApiLeaderboardPick,
  gamesById: Map<number, ApiJoinGame>,
  weekLocked: boolean
): UserPick => {
  const game = gamesById.get(pick.game_id);
  const homeTeam = game && toTeam(game.home_team);
  const awayTeam = game && toTeam(game.away_team);
  const team =
    homeTeam?.id === pick.team_id
      ? homeTeam.abbr
      : awayTeam?.id === pick.team_id
      ? awayTeam.abbr
      : "";
  const game_status = (game?.status as GameStatus) ?? GameStatus.Scheduled;

  return {
    game_id: pick.game_id,
    team,
    is_correct: pick.is_correct,
    trending_status: pick.trending_status,
    game_status,
    visible: weekLocked,
  };
};

// A pick only means something once its game has started (team + correctness are
// otherwise unknowable), so we drop not-yet-visible picks here rather than carry
// around a "hidden" entry that looks identical to a failed game lookup. Padding
// back up to five TBD placeholders is gated on has_submitted_picks (CBS's own
// submission flag) -- the per-game detail can lag the submission itself (seen
// live: has_submitted_picks true with picks: []), and without padding a
// submitted-but-not-yet-joined user would look identical to someone who simply
// hasn't picked yet.
//
// has_submitted_picks is missing entirely from some weeks' leaderboard payload
// (confirmed live on week 2 -- not just false, absent), so treat it as unknown
// rather than "not submitted" whenever real picks already joined: never
// discard picks we actually have. Only fall back to zero slots when there's
// nothing to show AND the flag isn't affirmatively true.
const tbdPlaceholder = (index: number): UserPick => ({
  game_id: -1 - index,
  team: "",
  is_correct: null,
  game_status: GameStatus.Scheduled,
  visible: false,
});

const withTbdPlaceholders = (
  visiblePicks: UserPick[],
  hasSubmittedPicks: boolean | undefined
): UserPick[] => {
  if (visiblePicks.length === 0 && !hasSubmittedPicks) return [];

  const missing = hasSubmittedPicks
    ? Math.max(0, REQUIRED_PICKS_PER_WEEK - visiblePicks.length)
    : 0;
  return [
    ...visiblePicks,
    ...Array.from({ length: missing }, (_, i) => tbdPlaceholder(i)),
  ];
};

const toRankedUser = (
  user: ApiLeaderboardUser,
  gamesById: Map<number, ApiJoinGame>,
  weekLocked: boolean,
  overallRanks: Map<number, number | null>,
  secondHalfRanks: Map<number, number | null>
): RankedUser => {
  const visiblePicks = user.picks
    .map((pick) => joinPick(pick, gamesById, weekLocked))
    .filter((pick) => pick.visible);

  return {
    id: String(user.user_id),
    name: user.name,
    weekly_score: user.weekly_score,
    trending_score: user.trending_score,
    cumulative_score: user.cumulative_score,
    second_half_score: user.second_half_score,
    place: overallRanks.get(user.user_id) ?? user.place,
    second_half_place: secondHalfRanks.get(user.user_id) ?? null,
    picks: withTbdPlaceholders(visiblePicks, user.has_submitted_picks),
  };
};

export const GetUserByWeek = (
  season: number,
  week: number,
  callback: (users: RankedUser[]) => void
) => {
  if (season === 0 || week === 0) {
    callback([]);
    return;
  }

  let cancelled = false;

  const stop = poll(() => {
    Promise.all([fetchLeaderboard(season, week), fetchWeekGames(season, week)])
      .then(([leaderboard, weekGames]) => {
        if (cancelled) return;

        const gamesById = buildGamesById(weekGames.games);
        const weekLocked = isWeekLocked(weekGames.games);
        const overallRanks = rankByScore(
          leaderboard.users,
          (user) => user.cumulative_score + user.trending_score
        );
        const secondHalfRanks = rankByScore(leaderboard.users, (user) =>
          user.second_half_score == null
            ? null
            : user.second_half_score + user.trending_score
        );
        const rankedUsers = leaderboard.users
          .map((user) =>
            toRankedUser(user, gamesById, weekLocked, overallRanks, secondHalfRanks)
          )
          .sort(compareUsers);

        callback(rankedUsers);
      })
      .catch((error) => {
        if (!cancelled) {
          console.error("Failed to fetch week leaderboard", error);
        }
      });
  }, POLL_INTERVAL_MS);

  return () => {
    cancelled = true;
    stop();
  };
};
