import dayjs from "dayjs";
import { ReactNode, useEffect, useState } from "react";
import { ordinal } from "../../helper";
import { AtsSplit, PoolPicker, TeamGame, TeamProfile } from "../../types";
import { getTeamFullName, teamBandColors } from "../../utils/teamAssets";
import TabSkeleton from "../TabSkeleton";
import { BackLink } from "../shared/BackLink";
import TabIntro from "../TabIntro";
import { PlayerLink } from "../shared/PlayerLink";
import { TeamLink } from "../shared/TeamLink";
import { TeamLogo } from "../shared/TeamLogo";
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
import { Button } from "../../ui/Button";
import { Icon } from "../../ui/Icon";
import tableStyles from "../../ui/table.module.css";
import uiStyles from "../../ui/ui.module.css";
import styles from "./TeamPage.module.css";

const cx = (...names: (string | false | undefined)[]) =>
  names.filter(Boolean).join(" ");

// Schedule cells on ui/table.module.css; `right` for the number columns.
const headCell = (right = false) =>
  cx(
    tableStyles.cell,
    tableStyles.small,
    tableStyles.head,
    right && tableStyles.right,
    styles.cell,
    styles.headCell
  );
const bodyCell = (right = false) =>
  cx(
    tableStyles.cell,
    tableStyles.small,
    right && tableStyles.right,
    styles.cell
  );

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
  <div
    className={cx(
      styles.card,
      highlight && styles.highlight,
      tone === "pool" && styles.poolTone
    )}
  >
    <h3 className={styles.cardTitle}>{title}</h3>
    {children}
  </div>
);

const BigRecord = ({ value, note }: { value: string; note?: string }) => (
  <div className={styles.bigRecord}>
    <p className={styles.bigValue}>{value}</p>
    {note && <p className={styles.note2}>{note}</p>}
  </div>
);

const Pair = ({ items }: { items: { value: string; label: string }[] }) => (
  <div className={styles.pair}>
    {items.map(({ value, label }) => (
      <div key={label} className={styles.stack}>
        <p className={styles.pairValue}>{value}</p>
        <span className={styles.caption}>{label}</span>
      </div>
    ))}
  </div>
);

const Split = ({ label, ats }: { label: string; ats: AtsSplit }) => (
  <div className={styles.stack}>
    <p className={styles.splitValue}>{formatAts(ats)}</p>
    <span className={styles.caption}>{label}</span>
  </div>
);

const Covered = ({ covered }: { covered: boolean | null }) => {
  if (covered == null) return <div className={styles.none}>–</div>;
  return (
    <span
      className={cx(
        styles.covered,
        covered ? styles.coveredYes : styles.coveredNo
      )}
    >
      <Icon
        name={covered ? "Check" : "Close"}
        size="inherit"
        className={styles.coveredIcon}
      />
      {/* Phones keep only the mark; the word is still read out. */}
      <span className={styles.coveredWord}>
        {covered ? "Covered" : "Missed"}
      </span>
    </span>
  );
};

// How many in the pool took this team vs. their opponent, as a bar.
const PoolSplit = ({ game }: { game: TeamGame }) => {
  const total = game.pool_picked + game.pool_against;
  if (!total) return <div className={styles.none}>–</div>;
  return (
    <div className={styles.poolSplit}>
      <span className={styles.poolCount}>
        {game.pool_picked}–{game.pool_against}
      </span>
      <div aria-hidden className={styles.poolBar}>
        <div
          className={styles.poolBarFill}
          style={{ width: `${(game.pool_picked / total) * 100}%` }}
        />
      </div>
    </div>
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
    <div>
      <h4 className={styles.peopleTitle}>
        {title} <span className={styles.peopleCount}>({people.length})</span>
      </h4>
      {people.length === 0 ? (
        <p className={styles.note2}>{empty}</p>
      ) : (
        <ul className={styles.people}>
          {shown.map((person) => {
            const id = String(person.user_id);
            return (
              <li
                key={id}
                className={cx(styles.person, id === userId && styles.highlight)}
              >
                <PlayerLink id={id} className={styles.personLink}>
                  <UserAvatar
                    userId={id}
                    userName={person.name}
                    size={20}
                    includeName={false}
                  />
                  <span className={styles.personName}>{person.name}</span>
                </PlayerLink>
                <span className={styles.personPicks}>
                  {person.picks} {person.picks === 1 ? "pick" : "picks"} ·{" "}
                  {person.wins}-{person.losses}
                </span>
              </li>
            );
          })}
        </ul>
      )}
      {people.length > PEOPLE_SHOWN && (
        <Button
          size="small"
          onClick={() => setShowAll((v) => !v)}
          style={{ marginTop: 4 }}
        >
          {showAll ? "Show fewer" : `Show all ${people.length}`}
        </Button>
      )}
    </div>
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
      <div className={styles.page}>
        {back}
        <LoadError
          title={`There's no team at “${slug}”.`}
          detail="Pick one from the standings."
          style={{ marginTop: 16 }}
        />
      </div>
    );
  }

  if (!profile || !placed) {
    return (
      <div className={styles.page}>
        {back}
        {failed || standingsFailed ? (
          <LoadError
            title="Couldn't load this team."
            detail="Trying again every 5 minutes."
            onRetry={standingsFailed ? retryStandings : retryProfile}
            style={{ marginTop: 16 }}
          />
        ) : (
          <TabSkeleton shape="cards" label="Loading the team" />
        )}
      </div>
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
      // On the team's color band, so it takes the band's white.
      back={
        <BackLink
          fallback="/nfl?view=standings"
          label="Standings"
          inheritColor
        />
      }
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
    <div className={styles.page}>
      {/* The team's own colors open its page: white text on the team color
          (darkened where it's light), the alternate color as a stripe. */}
      <div
        className={styles.band}
        style={{ backgroundColor: `#${band}`, borderBottomColor: `#${stripe}` }}
      >
        <TabIntro
          back={back}
          leading={
            <div className={styles.logoDisc}>
              <TeamLogo abbr={abbr} size={40} decorative />
            </div>
          }
          title={getTeamFullName(abbr)}
          subtitle={
            <p className={styles.subtitle}>
              {ordinal(row.rank)} in {division} · {formatWinLoss(row)}
              {row.streak && ` · ${row.streak}`} · {row.points_for}–
              {row.points_against} pts
            </p>
          }
        />
      </div>
      <div className={styles.sections}>
        <div className={styles.cards}>
          <div className={styles.cardCell}>
            <StatCard title="Against the CBS line">
              <BigRecord
                value={formatAts(ats.overall)}
                note={
                  ats.overall.cover_pct == null
                    ? undefined
                    : `${pct(ats.overall.cover_pct)} covered`
                }
              />
              <div className={styles.splits}>
                <Split label="Home" ats={ats.home} />
                <Split label="Road" ats={ats.away} />
                <Split label="Favored" ats={ats.favorite} />
                <Split label="Underdog" ats={ats.underdog} />
              </div>
            </StatCard>
          </div>
          <div className={cx(styles.cardCell, userId && styles.cardHalf)}>
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
          </div>
          {userId && userName && (
            <div className={cx(styles.cardCell, styles.cardHalf)}>
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
                  <p className={styles.note2}>Hasn't picked their games yet.</p>
                )}
              </StatCard>
            </div>
          )}
        </div>

        <div className={styles.columns}>
          <div className={styles.schedule}>
            <h3 className={styles.sectionTitle}>Schedule</h3>
            <span className={cx(styles.caption, styles.sectionNote)}>
              Line is their CBS line. Pool is how many picked them vs. their
              opponent; it grows as picks show at kickoff.
            </span>
            <div className={tableStyles.container}>
              <table
                aria-label={`${abbr} schedule`}
                className={tableStyles.table}
              >
                <thead>
                  <tr>
                    <th scope="col" className={headCell()}>
                      Wk
                    </th>
                    <th scope="col" className={headCell()}>
                      Opp
                    </th>
                    <th scope="col" className={headCell(true)}>
                      Line
                    </th>
                    <th scope="col" className={headCell(true)}>
                      Result
                    </th>
                    <th scope="col" className={headCell(true)}>
                      ATS
                    </th>
                    <th
                      scope="col"
                      className={headCell(true)}
                      title="Pool picks of them vs. the opponent"
                    >
                      Pool
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {withByes(profile.games).map((game) =>
                    "bye" in game ? (
                      <tr key={`bye-${game.bye}`}>
                        <td className={bodyCell()}>{game.bye}</td>
                        <td
                          colSpan={5}
                          className={cx(bodyCell(), styles.byeCell)}
                        >
                          Bye
                        </td>
                      </tr>
                    ) : (
                      <tr
                        key={game.game_id}
                        // This week: a slate-50 row in bold, with "this week" spoken
                        // after the week number.
                        className={
                          game.week_number === currentWeek
                            ? styles.thisWeek
                            : undefined
                        }
                      >
                        <td className={bodyCell()}>
                          {game.week_number}
                          {game.week_number === currentWeek && (
                            <span className={uiStyles.visuallyHidden}>
                              , this week
                            </span>
                          )}
                        </td>
                        <td className={bodyCell()}>
                          <div className={styles.opponent}>
                            <span className={styles.side}>
                              {game.side === "home" ? "vs" : "@"}
                            </span>
                            <TeamLink
                              abbr={game.opponent.abbr}
                              className={styles.opponentLink}
                            >
                              <TeamLogo
                                abbr={game.opponent.abbr}
                                size={20}
                                decorative
                              />
                              <span className={styles.opponentAbbr}>
                                {game.opponent.abbr}
                              </span>
                            </TeamLink>
                          </div>
                        </td>
                        <td className={bodyCell(true)}>
                          {formatLine(game.line)}
                        </td>
                        <td className={bodyCell(true)}>{resultText(game)}</td>
                        <td className={bodyCell(true)}>
                          <Covered covered={game.covered} />
                        </td>
                        <td className={bodyCell(true)}>
                          <PoolSplit game={game} />
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className={styles.pickers}>
            <h3 className={styles.sectionTitle}>Who's picked them</h3>
            <span className={cx(styles.caption, styles.sectionNote)}>
              Believers picked them, faders picked their opponent. One player
              can be both over a season.
            </span>
            <div className={styles.peopleLists}>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
