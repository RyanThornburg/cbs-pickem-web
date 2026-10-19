import { ReactNode, useEffect } from "react";
import { ordinal } from "../../helper";
import { PayPeriod, RankedUser } from "../../types";
import { periodName, shownSegment } from "../../utils/payPeriods";
import TabSkeleton from "../TabSkeleton";
import { Skeleton } from "../../ui/Skeleton";
import UserAvatar from "../UserAvatar";
import { useStandings } from "../Nfl/useNflData";
import { BackLink } from "../shared/BackLink";
import LoadError from "../shared/LoadError";
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
import { Button } from "../../ui/Button";
import styles from "./PlayerPage.module.css";

const Section = ({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: ReactNode;
}) => (
  <section className={styles.section}>
    <h3 className={styles.sectionTitle}>{title}</h3>
    {children}
    {note && <span className={styles.note}>{note}</span>}
  </section>
);

const Fact = ({ children }: { children: ReactNode }) => (
  <span className={styles.fact}>{children}</span>
);

const Strong = ({ children }: { children: ReactNode }) => (
  <b className={styles.strong}>{children}</b>
);

const NotYet = ({ children }: { children: ReactNode }) => (
  <p className={styles.notYet}>{children}</p>
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
  const { trends, failed, missing, retry } = usePlayerSeason(playerId, season);
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

  // Only a 404 means there's no such player; any other failure is the
  // data being unreachable, which mustn't read as "no player".
  if (failed && !trends && !rosterEntry) {
    return (
      <div className={styles.page}>
        {back}
        {missing ? (
          <LoadError
            title="There's no player here this season."
            detail="Pick one from User Picks."
            style={{ marginTop: 16 }}
          />
        ) : (
          <LoadError
            title="Couldn't load this player."
            detail="Trying again every 30 minutes."
            onRetry={retry}
            style={{ marginTop: 16 }}
          />
        )}
      </div>
    );
  }

  const current = trends?.current_season;
  const records = current?.records;
  const total = seasonRecord(records);
  const career = trends?.career;
  const segment = shownSegment(periods, currentWeek);
  const segmentPlace = segment && now?.periods[segment.key]?.place;

  return (
    <div className={styles.page}>
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
            <div className={styles.facts}>
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
            </div>
            {moneyStandings.length > 0 && (
              // The question the site exists for: in the money, or how far
              // out, with the weeks left.
              <div className={styles.money}>
                <MoneyLines standings={moneyStandings} />
              </div>
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
      <div className={styles.blocks}>
        <div className={styles.row}>
          <div className={`${styles.col} ${styles.wide}`}>
            <Section title="Week by week">
              {!weeksLoaded && myWeeks.length === 0 ? (
                <TabSkeleton shape="rows" label="Loading the weeks" />
              ) : (
                <ol className={styles.weeks}>
                  {myWeeks.map(({ week, user }) => {
                    const live = week === currentWeek;
                    return (
                      <li key={week} className={styles.week}>
                        <div className={styles.weekLabel}>
                          <p className={styles.weekName}>Week {week}</p>
                          <span className={styles.weekPlace}>
                            {live
                              ? "this week"
                              : `${ordinal(user.place)} overall`}
                          </span>
                        </div>
                        <p
                          aria-label={`${user.weekly_score + (live ? user.trending_score : 0)} points`}
                          className={styles.weekScore}
                        >
                          {user.weekly_score + (live ? user.trending_score : 0)}
                        </p>
                        <div className={styles.weekPicks}>
                          {UserGamePicksStack(
                            user.picks,
                            false,
                            user.has_submitted_picks
                          ) ?? <NotYet>No picks shown yet.</NotYet>}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </Section>
          </div>
          <div className={`${styles.col} ${styles.narrow}`}>
            {/* How they pick: by side and role, then by the size of the line. */}
            <div className={styles.howTheyPick}>
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
                    className={styles.sideRoleSkeleton}
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
                    className={styles.ladderSkeleton}
                  />
                )}
              </Section>
            </div>
          </div>
        </div>

        <div className={styles.row}>
          <div className={`${styles.col} ${styles.half}`}>
            <Section title="Notes">
              {trends ? (
                <div className={styles.notes}>
                  <UserTrendPanel trends={trends} />
                </div>
              ) : (
                <Skeleton variant="rounded" height={120} />
              )}
            </Section>
          </div>
          <div className={`${styles.col} ${styles.half}`}>
            <Section
              title="Finishes"
              note={
                now
                  ? `So far: ${ordinal(now.place)} in ${season}, not final yet.`
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
          </div>
        </div>

        <Section
          title="Team by team"
          note="For: picking that team. Vs: picking their opponent. Green: right in 60%+ of their games either way; red: 40% or less."
        >
          {standings && trends ? (
            <TeamGrid standings={standings} teams={records?.teams ?? []} />
          ) : (
            <Skeleton variant="rounded" height={220} />
          )}
        </Section>
      </div>
    </div>
  );
}
