import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import dayjs from "dayjs";
import { ReactNode, useEffect, useState } from "react";
import { ordinal, visuallyHidden } from "../../helper";
import { AtsSplit, PoolPicker, TeamGame, TeamProfile } from "../../types";
import { getTeamFullName, teamBandColors } from "../../utils/teamAssets";
import { gray, pool } from "../../shared-theme/themePrimitives";
import TabSkeleton from "../TabSkeleton";
import { BackLink } from "../shared/BackLink";
import TabIntro from "../TabIntro";
import { PlayerLink } from "../shared/PlayerLink";
import { TeamLink } from "../shared/TeamLink";
import { TeamLogo } from "../shared/TeamLogo";
import { selectedRowSx } from "../UsersTable/selectedRowSx";
import { usePlayerSeason } from "../Players/usePlayerData";
import UserAvatar from "../UserAvatar";
import {
  findTeamBySlug,
  formatAts,
  formatPickRecord,
  formatWinLoss,
} from "./standingsUtils";
import { useStandings, useTeamProfile } from "./useNflData";
import LoadError from "../shared/LoadError";

// How many believers or faders show before "Show all".
const PEOPLE_SHOWN = 8;

const pct = (value: number | null) =>
  value == null ? null : `${Math.round(value * 100)}%`;

// "−7½", "+3½", "PK"; the team's own CBS line.
export const formatLine = (line: number | null): string => {
  if (line == null) return "TBD";
  if (line === 0) return "PK";
  const abs = Math.abs(line);
  const whole = Math.floor(abs);
  const text = abs % 1 === 0.5 ? `${whole || ""}½` : String(abs);
  return `${line > 0 ? "+" : "−"}${text}`;
};

// `highlight` is the selected player (lime, as on every tab); `pool` is the
// pool's own violet, for the card that counts the pool's picks.
const StatCard = ({
  title,
  children,
  highlight = false,
  tone,
}: {
  title: string;
  children: ReactNode;
  highlight?: boolean;
  tone?: "pool";
}) => (
  <Paper
    variant="outlined"
    sx={[
      {
        p: 1.75,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 1,
      },
      highlight && selectedRowSx,
      tone === "pool" && { bgcolor: pool[50], borderColor: pool[200] },
    ]}
  >
    <Typography
      component="h3"
      sx={{
        fontSize: "0.8125rem",
        fontWeight: 600,
        color: tone === "pool" ? pool[700] : undefined,
      }}
    >
      {title}
    </Typography>
    {children}
  </Paper>
);

const BigRecord = ({ value, note }: { value: string; note?: string }) => (
  <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.75 }}>
    <Typography
      sx={{
        fontSize: "1.75rem",
        fontWeight: 700,
        lineHeight: 1.1,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {value}
    </Typography>
    {note && (
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        {note}
      </Typography>
    )}
  </Box>
);

const Pair = ({ items }: { items: { value: string; label: string }[] }) => (
  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2.5 }}>
    {items.map(({ value, label }) => (
      <Box key={label} sx={{ display: "flex", flexDirection: "column" }}>
        <Typography
          sx={{
            fontSize: "1.25rem",
            fontWeight: 700,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {value}
        </Typography>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          {label}
        </Typography>
      </Box>
    ))}
  </Box>
);

const Split = ({ label, ats }: { label: string; ats: AtsSplit }) => (
  <Box sx={{ display: "flex", flexDirection: "column" }}>
    <Typography
      sx={{
        fontSize: "0.875rem",
        fontWeight: 600,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {formatAts(ats)}
    </Typography>
    <Typography variant="caption" sx={{ color: "text.secondary" }}>
      {label}
    </Typography>
  </Box>
);

const Covered = ({ covered }: { covered: boolean | null }) => {
  if (covered == null) return <Box sx={{ color: "text.disabled" }}>–</Box>;
  const Icon = covered ? CheckIcon : CloseIcon;
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.25,
        fontWeight: 600,
        // DESIGN.md's dark green/red, for text on white.
        color: covered ? "success.dark" : "error.dark",
      }}
    >
      <Icon aria-hidden sx={{ fontSize: "1rem" }} />
      {/* Phones keep only the mark; the word is still read out. */}
      <Box
        component="span"
        sx={(theme) => ({ [theme.breakpoints.down("sm")]: visuallyHidden })}
      >
        {covered ? "Covered" : "Missed"}
      </Box>
    </Box>
  );
};

// How many in the pool took this team vs. their opponent, as a bar.
const PoolSplit = ({ game }: { game: TeamGame }) => {
  const total = game.pool_picked + game.pool_against;
  if (!total) return <Box sx={{ color: "text.disabled" }}>–</Box>;
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: 1,
      }}
    >
      <Box component="span" sx={{ fontSize: "0.8125rem" }}>
        {game.pool_picked}–{game.pool_against}
      </Box>
      <Box
        aria-hidden
        sx={{
          display: { xs: "none", sm: "flex" },
          width: 72,
          height: 6,
          borderRadius: 3,
          overflow: "hidden",
          bgcolor: pool[100],
        }}
      >
        <Box
          sx={{
            width: `${(game.pool_picked / total) * 100}%`,
            bgcolor: pool[500],
          }}
        />
      </Box>
    </Box>
  );
};

const resultText = (game: TeamGame): string => {
  if (game.status === "FINAL" && game.score != null) {
    return `${game.result ?? ""} ${game.score}-${game.opponent_score}`.trim();
  }
  if (game.status === "SCHEDULED") {
    const kickoff = dayjs(game.game_time);
    return kickoff.isValid() ? kickoff.format("ddd M/D") : "Time TBD";
  }
  if (game.status === "IN_PROGRESS" || game.status === "HALFTIME") {
    return "Live";
  }
  return game.status.toLowerCase().replace(/_/g, " ");
};

// The schedule with bye weeks filled in where the week numbers skip.
const withByes = (games: TeamGame[]): (TeamGame | { bye: number })[] => {
  const rows: (TeamGame | { bye: number })[] = [];
  games.forEach((game, index) => {
    const previous = index > 0 ? games[index - 1].week_number : 0;
    for (let week = previous + 1; week < game.week_number; week++) {
      rows.push({ bye: week });
    }
    rows.push(game);
  });
  return rows;
};

const People = ({
  title,
  people,
  empty,
  userId,
}: {
  title: string;
  people: PoolPicker[];
  empty: string;
  userId?: string;
}) => {
  const [showAll, setShowAll] = useState(false);
  const shown = showAll ? people : people.slice(0, PEOPLE_SHOWN);
  return (
    <Box>
      <Typography
        component="h4"
        sx={{ fontSize: "0.8125rem", fontWeight: 600, mb: 0.5 }}
      >
        {title}{" "}
        <Box component="span" sx={{ color: "text.secondary", fontWeight: 400 }}>
          ({people.length})
        </Box>
      </Typography>
      {people.length === 0 ? (
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {empty}
        </Typography>
      ) : (
        <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
          {shown.map((person) => {
            const id = String(person.user_id);
            return (
              <Box
                component="li"
                key={id}
                sx={[
                  {
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    px: 0.75,
                    py: 0.5,
                    borderRadius: 1,
                    fontSize: "0.8125rem",
                  },
                  id === userId && selectedRowSx,
                ]}
              >
                <PlayerLink id={id} sx={{ flex: 1, minWidth: 0, gap: 0.75 }}>
                  <UserAvatar
                    userId={id}
                    userName={person.name}
                    size={20}
                    includeName={false}
                  />
                  <Box
                    component="span"
                    sx={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {person.name}
                  </Box>
                </PlayerLink>
                <Box
                  component="span"
                  sx={{
                    color: "text.secondary",
                    fontVariantNumeric: "tabular-nums",
                    whiteSpace: "nowrap",
                  }}
                >
                  {person.picks} {person.picks === 1 ? "pick" : "picks"} ·{" "}
                  {person.wins}-{person.losses}
                </Box>
              </Box>
            );
          })}
        </Box>
      )}
      {people.length > PEOPLE_SHOWN && (
        <Button
          size="small"
          onClick={() => setShowAll((v) => !v)}
          sx={{ mt: 0.5 }}
        >
          {showAll ? "Show fewer" : `Show all ${people.length}`}
        </Button>
      )}
    </Box>
  );
};

export default function TeamPage({
  season,
  slug,
  currentWeek,
  userId,
  userName,
}: {
  season: number;
  slug: string;
  currentWeek: number;
  userId?: string;
  userName?: string;
}) {
  const {
    standings,
    failed: standingsFailed,
    retry: retryStandings,
  } = useStandings(season);
  const placed = standings ? findTeamBySlug(standings, slug) : undefined;
  const {
    profile,
    failed,
    retry: retryProfile,
  } = useTeamProfile(season, placed?.row.team.id);
  const { trends } = usePlayerSeason(userId || undefined, season);

  const back = <BackLink fallback="/nfl?view=standings" label="Standings" />;

  useEffect(() => {
    if (placed) {
      document.title = `${getTeamFullName(placed.row.team.abbr)} · Morlocked Pick'em`;
    }
  }, [placed]);

  if (standings && !placed) {
    return (
      <Box sx={{ textAlign: "left" }}>
        {back}
        <LoadError
          title={`There's no team at “${slug}”.`}
          detail="Pick one from the standings."
          sx={{ mt: 2 }}
        />
      </Box>
    );
  }

  if (!profile || !placed) {
    return (
      <Box sx={{ textAlign: "left" }}>
        {back}
        {failed || standingsFailed ? (
          <LoadError
            title="Couldn't load this team."
            detail="Trying again every 5 minutes."
            onRetry={standingsFailed ? retryStandings : retryProfile}
            sx={{ mt: 2 }}
          />
        ) : (
          <TabSkeleton shape="cards" label="Loading the team" />
        )}
      </Box>
    );
  }

  return (
    <TeamPageBody
      profile={profile as TeamProfile}
      placed={placed}
      currentWeek={currentWeek}
      userId={userId}
      userName={userName}
      playerRecord={trends?.current_season.records?.teams.find(
        (entry) => entry.team.id === placed.row.team.id
      )}
      back={back}
    />
  );
}

function TeamPageBody({
  profile,
  placed,
  currentWeek,
  userId,
  userName,
  playerRecord,
  back,
}: {
  profile: TeamProfile;
  placed: NonNullable<ReturnType<typeof findTeamBySlug>>;
  currentWeek: number;
  userId?: string;
  userName?: string;
  playerRecord?: {
    picked: TeamProfile["pool"]["picked"];
    against: TeamProfile["pool"]["against"];
  };
  back: ReactNode;
}) {
  const { row, division } = placed;
  const { ats, pool: poolRecord } = profile;
  const abbr = row.team.abbr;
  const { band, stripe } = teamBandColors(abbr);

  return (
    <Box sx={{ textAlign: "left" }}>
      {/* The team's own colors open its page: white text on the team color
          (darkened where it's light), the alternate color as a stripe. */}
      <Box
        sx={{
          bgcolor: `#${band}`,
          color: "#fff",
          borderRadius: 2,
          borderBottom: `4px solid #${stripe}`,
          px: { xs: 1.5, sm: 2 },
          pt: 1.5,
          pb: 0.5,
          mb: 2.5,
          "& .MuiButton-root": { color: "inherit" },
        }}
      >
        <TabIntro
          back={back}
          leading={
            <Box
              sx={{
                width: 56,
                height: 56,
                flex: "none",
                borderRadius: "50%",
                bgcolor: "#fff",
                display: "grid",
                placeItems: "center",
              }}
            >
              <TeamLogo abbr={abbr} size={40} decorative />
            </Box>
          }
          title={getTeamFullName(abbr)}
          subtitle={
            <Typography
              variant="body2"
              sx={{ color: "rgba(255, 255, 255, 0.85)" }}
            >
              {ordinal(row.rank)} in {division} · {formatWinLoss(row)}
              {row.streak && ` · ${row.streak}`} · {row.points_for}–
              {row.points_against} pts
            </Typography>
          }
        />
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
        <Grid container spacing={1.5}>
          <Grid size={{ xs: 12, md: 4 }}>
            <StatCard title="Against the CBS line">
              <BigRecord
                value={formatAts(ats.overall)}
                note={
                  ats.overall.cover_pct == null
                    ? undefined
                    : `${pct(ats.overall.cover_pct)} covered`
                }
              />
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                  gap: 1,
                }}
              >
                <Split label="Home" ats={ats.home} />
                <Split label="Road" ats={ats.away} />
                <Split label="Favored" ats={ats.favorite} />
                <Split label="Underdog" ats={ats.underdog} />
              </Box>
            </StatCard>
          </Grid>
          <Grid size={{ xs: 12, sm: userId ? 6 : 12, md: 4 }}>
            <StatCard title="The pool on them" tone="pool">
              <Pair
                items={[
                  {
                    value: formatPickRecord(poolRecord.picked) ?? "–",
                    label: `picking them (${poolRecord.picked.picks})`,
                  },
                  {
                    value: formatPickRecord(poolRecord.against) ?? "–",
                    label: `picking against (${poolRecord.against.picks})`,
                  },
                ]}
              />
            </StatCard>
          </Grid>
          {userId && userName && (
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <StatCard title={userName} highlight>
                {playerRecord &&
                playerRecord.picked.picks + playerRecord.against.picks > 0 ? (
                  <Pair
                    items={[
                      {
                        value: formatPickRecord(playerRecord.picked) ?? "–",
                        label: `picking them (${playerRecord.picked.picks})`,
                      },
                      {
                        value: formatPickRecord(playerRecord.against) ?? "–",
                        label: `picking against (${playerRecord.against.picks})`,
                      },
                    ]}
                  />
                ) : (
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Hasn't picked their games yet.
                  </Typography>
                )}
              </StatCard>
            </Grid>
          )}
        </Grid>

        <Grid container columnSpacing={3} rowSpacing={2.5}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <Typography
              component="h3"
              sx={{ fontSize: "1.125rem", fontWeight: 600, mb: 1 }}
            >
              Schedule
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: "text.secondary", display: "block", mb: 1 }}
            >
              Line is their CBS line. Pool is how many picked them vs. their
              opponent; it grows as picks show at kickoff.
            </Typography>
            <TableContainer>
              <Table
                size="small"
                aria-label={`${abbr} schedule`}
                sx={{
                  "& td, & th": {
                    px: { xs: 0.5, sm: 1 },
                    whiteSpace: "nowrap",
                    fontVariantNumeric: "tabular-nums",
                  },
                  "& th": { fontSize: "0.75rem", color: "text.secondary" },
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell>Wk</TableCell>
                    <TableCell>Opp</TableCell>
                    <TableCell align="right">Line</TableCell>
                    <TableCell align="right">Result</TableCell>
                    <TableCell align="right">ATS</TableCell>
                    <TableCell
                      align="right"
                      title="Pool picks of them vs. the opponent"
                    >
                      Pool
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {withByes(profile.games).map((game) =>
                    "bye" in game ? (
                      <TableRow key={`bye-${game.bye}`}>
                        <TableCell>{game.bye}</TableCell>
                        <TableCell colSpan={5} sx={{ color: "text.secondary" }}>
                          Bye
                        </TableCell>
                      </TableRow>
                    ) : (
                      <TableRow
                        key={game.game_id}
                        // This week: a slate-50 row in bold, with "this week" spoken
                        // after the week number.
                        sx={
                          game.week_number === currentWeek
                            ? { bgcolor: gray[50], "& td": { fontWeight: 600 } }
                            : undefined
                        }
                      >
                        <TableCell>
                          {game.week_number}
                          {game.week_number === currentWeek && (
                            <Box component="span" sx={visuallyHidden}>
                              , this week
                            </Box>
                          )}
                        </TableCell>
                        <TableCell>
                          <Box
                            sx={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 0.75,
                            }}
                          >
                            <Box
                              component="span"
                              sx={{
                                color: "text.secondary",
                                width: 18,
                                fontSize: "0.75rem",
                              }}
                            >
                              {game.side === "home" ? "vs" : "@"}
                            </Box>
                            <TeamLink
                              abbr={game.opponent.abbr}
                              sx={{ gap: 0.75 }}
                            >
                              <TeamLogo
                                abbr={game.opponent.abbr}
                                size={20}
                                decorative
                              />
                              <Box component="span" sx={{ fontWeight: 600 }}>
                                {game.opponent.abbr}
                              </Box>
                            </TeamLink>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          {formatLine(game.line)}
                        </TableCell>
                        <TableCell align="right">{resultText(game)}</TableCell>
                        <TableCell align="right">
                          <Covered covered={game.covered} />
                        </TableCell>
                        <TableCell align="right">
                          <PoolSplit game={game} />
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
          <Grid size={{ xs: 12, lg: 4 }}>
            <Typography
              component="h3"
              sx={{ fontSize: "1.125rem", fontWeight: 600, mb: 1 }}
            >
              Who's picked them
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: "text.secondary", display: "block", mb: 1 }}
            >
              Believers picked them, faders picked their opponent. One player
              can be both over a season.
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <People
                title="Believers"
                people={poolRecord.believers}
                empty="No one has picked them yet."
                userId={userId}
              />
              <People
                title="Faders"
                people={poolRecord.faders}
                empty="No one has picked against them yet."
                userId={userId}
              />
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
