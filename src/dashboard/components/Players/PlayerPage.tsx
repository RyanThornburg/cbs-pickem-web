import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import { ReactNode, useEffect } from "react";
import { ordinal } from "../../helper";
import { PayPeriod, RankedUser } from "../../types";
import { periodName, shownSegment } from "../../utils/payPeriods";
import TabSkeleton from "../TabSkeleton";
import UserAvatar from "../UserAvatar";
import { useStandings } from "../Nfl/useNflData";
import { BackLink } from "../shared/BackLink";
import TabIntro from "../TabIntro";
import { UserGamePicksStack } from "../UsersTable/UserPickStack";
import { UserTrendPanel } from "../UsersTable/UserTrendPanel";
import { MoneyLines } from "../UsersTable/MoneyLines";
import { ShownMoneyStanding } from "../UsersTable/usersTableUtils";
import { FinishesChart } from "./FinishesChart";
import { SideRoleGrid } from "./SideRoleGrid";
import { SpreadLadder } from "./SpreadLadder";
import { TeamGrid } from "./TeamGrid";
import { finishPoints, playerWeeks, seasonRecord } from "./playerUtils";
import { usePlayerSeason, useSeasonWeeks } from "./usePlayerData";

const Section = ({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: ReactNode;
}) => (
  <Box
    component="section"
    sx={{ display: "flex", flexDirection: "column", gap: 1.25, minWidth: 0 }}
  >
    <Typography component="h3" sx={{ fontSize: "1.125rem", fontWeight: 600 }}>
      {title}
    </Typography>
    {children}
    {note && (
      <Typography
        variant="caption"
        sx={{ color: "text.secondary", fontSize: "0.75rem" }}
      >
        {note}
      </Typography>
    )}
  </Box>
);

const Fact = ({ children }: { children: ReactNode }) => (
  <Box component="span" sx={{ whiteSpace: "nowrap" }}>
    {children}
  </Box>
);

const Strong = ({ children }: { children: ReactNode }) => (
  <Box component="b" sx={{ color: "text.primary", fontWeight: 600 }}>
    {children}
  </Box>
);

const NotYet = ({ children }: { children: ReactNode }) => (
  <Typography variant="body2" sx={{ color: "text.secondary" }}>
    {children}
  </Typography>
);

export default function PlayerPage({
  season,
  currentWeek,
  periods,
  playerId,
  selectedId,
  userList,
  moneyStandings,
  onSelect,
}: {
  season: number;
  currentWeek: number;
  periods: PayPeriod[];
  playerId: string;
  // The header's selected player, highlighted in the pool's lists.
  selectedId: string;
  // The browsed week's roster, for a name before the profile loads.
  userList: RankedUser[];
  // This player's money standings for the browsed week (in the money, or
  // within reach), the same lines as the header's player card.
  moneyStandings: ShownMoneyStanding[];
  onSelect: (id: string) => void;
}) {
  const { trends, failed } = usePlayerSeason(playerId, season);
  const { weeks, loaded: weeksLoaded } = useSeasonWeeks(season, currentWeek);
  const { standings } = useStandings(season);

  const rosterEntry = userList.find((user) => user.id === playerId);
  const name = trends?.name ?? rosterEntry?.name;
  const myWeeks = playerWeeks(weeks, playerId);
  const now = myWeeks.find((entry) => entry.week === currentWeek)?.user;
  const isSelected = playerId === selectedId;

  useEffect(() => {
    if (name) document.title = `${name} · Morlocked Pick'em`;
  }, [name]);

  const back = <BackLink fallback="/picks" label="User Picks" />;

  if (failed && !trends && !rosterEntry) {
    return (
      <Box sx={{ textAlign: "left" }}>
        {back}
        <Alert severity="warning" sx={{ mt: 2 }}>
          There's no player here this season. Pick one from User Picks.
        </Alert>
      </Box>
    );
  }

  const current = trends?.current_season;
  const records = current?.records;
  const total = seasonRecord(records);
  const career = trends?.career;
  const segment = shownSegment(periods, currentWeek);
  const segmentPlace = segment && now?.periods[segment.key]?.place;

  return (
    <Box sx={{ textAlign: "left" }}>
      <TabIntro
        back={back}
        leading={
          <UserAvatar
            userId={playerId}
            userName={name}
            size={56}
            includeName={false}
          />
        }
        title={name ?? <Skeleton width={180} />}
        subtitle={
          <>
            <Typography
              variant="body2"
              component="div"
              sx={{
                color: "text.secondary",
                display: "flex",
                flexWrap: "wrap",
                columnGap: 2,
                rowGap: 0.25,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {now && (
                <Fact>
                  <Strong>{ordinal(now.place)}</Strong> overall ·{" "}
                  {now.cumulative_score + now.trending_score} pts
                </Fact>
              )}
              {segment && segmentPlace != null && (
                <Fact>
                  {periodName(segment)} <Strong>{ordinal(segmentPlace)}</Strong>
                </Fact>
              )}
              {total && (
                <Fact>
                  Picks{" "}
                  <Strong>
                    {total.wins}-{total.losses}
                  </Strong>{" "}
                  (
                  {Math.round((total.wins / (total.wins + total.losses)) * 100)}
                  %)
                </Fact>
              )}
              {career && (
                <Fact>
                  <Strong>{career.years_played}</Strong>{" "}
                  {career.years_played === 1 ? "season" : "seasons"}
                  {career.titles > 0 &&
                    ` · ${career.titles} ${career.titles === 1 ? "title" : "titles"}`}
                </Fact>
              )}
            </Typography>
            {moneyStandings.length > 0 && (
              // The question the site exists for: in the money, or how far
              // out, with the weeks left.
              <Box sx={{ mt: 0.75, display: "inline-block" }}>
                <MoneyLines standings={moneyStandings} />
              </Box>
            )}
          </>
        }
        actions={
          !isSelected && name ? (
            // Picking a player here is the same as picking them in the
            // header: their picks get highlighted on every tab.
            <Button
              size="small"
              variant="outlined"
              onClick={() => onSelect(playerId)}
            >
              This is me
            </Button>
          ) : undefined
        }
      />
      <Box sx={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <Grid container columnSpacing={4} rowSpacing={4}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Section title="Week by week">
              {!weeksLoaded && myWeeks.length === 0 ? (
                <TabSkeleton shape="rows" label="Loading the weeks" />
              ) : (
                <Box component="ol" sx={{ listStyle: "none", m: 0, p: 0 }}>
                  {myWeeks.map(({ week, user }) => {
                    const live = week === currentWeek;
                    return (
                      <Box
                        component="li"
                        key={week}
                        sx={{
                          display: "grid",
                          gridTemplateColumns: {
                            xs: "60px 28px minmax(0, 1fr)",
                            sm: "72px 36px minmax(0, 1fr)",
                          },
                          alignItems: "center",
                          columnGap: 1,
                          py: 1,
                          borderBottom: 1,
                          borderColor: "hsl(220, 30%, 94%)",
                          "&:last-of-type": { borderBottom: 0 },
                        }}
                      >
                        <Box sx={{ lineHeight: 1.25 }}>
                          <Typography
                            sx={{ fontSize: "0.8125rem", fontWeight: 600 }}
                          >
                            Week {week}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: "text.secondary" }}
                          >
                            {live
                              ? "this week"
                              : `${ordinal(user.place)} overall`}
                          </Typography>
                        </Box>
                        <Typography
                          aria-label={`${user.weekly_score + (live ? user.trending_score : 0)} points`}
                          sx={{
                            fontSize: "1.125rem",
                            fontWeight: 700,
                            textAlign: "center",
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {user.weekly_score + (live ? user.trending_score : 0)}
                        </Typography>
                        <Box sx={{ minWidth: 0 }}>
                          {UserGamePicksStack(
                            user.picks,
                            false,
                            user.has_submitted_picks
                          ) ?? <NotYet>No picks shown yet.</NotYet>}
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Section>
          </Grid>
          <Grid size={{ xs: 12, md: 5 }}>
            {/* How they pick: by side and role, then by the size of the line. */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <Section
                title="Home or road, favorite or underdog"
                note="Win-loss on each kind of pick this season. Green from 60%, red at 40% or less, from 3 graded picks."
              >
                {records?.side_roles ? (
                  <SideRoleGrid sideRoles={records.side_roles} />
                ) : trends ? (
                  <NotYet>Not enough picks yet.</NotYet>
                ) : (
                  <Skeleton
                    variant="rounded"
                    height={150}
                    sx={{ maxWidth: 440 }}
                  />
                )}
              </Section>
              <Section
                title="By the line"
                note="The picked team's CBS line. The edges sit at 3 and 7, the most common final margins."
              >
                {records?.spread_buckets ? (
                  <SpreadLadder buckets={records.spread_buckets} />
                ) : trends ? (
                  <NotYet>Not enough picks yet.</NotYet>
                ) : (
                  <Skeleton
                    variant="rounded"
                    height={170}
                    sx={{ maxWidth: 640 }}
                  />
                )}
              </Section>
            </Box>
          </Grid>
        </Grid>

        <Grid container columnSpacing={4} rowSpacing={4}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Section title="Notes">
              {trends ? (
                <Box
                  sx={{ mx: { xs: -1, sm: -1.5 }, mt: { xs: -1, sm: -1.5 } }}
                >
                  <UserTrendPanel trends={trends} />
                </Box>
              ) : (
                <Skeleton variant="rounded" height={120} />
              )}
            </Section>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Section
              title="Finishes"
              note={
                now
                  ? `The hollow dot is ${season} so far (${ordinal(now.place)}).`
                  : undefined
              }
            >
              {career ? (
                career.season_history.length > 0 || now ? (
                  <FinishesChart
                    points={finishPoints(
                      career.season_history,
                      season,
                      now?.place
                    )}
                  />
                ) : (
                  <NotYet>
                    First season. Finishes start once {season} closes.
                  </NotYet>
                )
              ) : (
                <Skeleton variant="rounded" height={170} />
              )}
            </Section>
          </Grid>
        </Grid>

        <Section
          title="Team by team"
          note="For: picking that team. Vs: picking their opponent. Tinted by the two together."
        >
          {standings && trends ? (
            <TeamGrid standings={standings} teams={records?.teams ?? []} />
          ) : (
            <Skeleton variant="rounded" height={220} />
          )}
        </Section>
      </Box>
    </Box>
  );
}
