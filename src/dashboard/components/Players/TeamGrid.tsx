import { useState } from "react";
import { NflStandings, TeamRef, UserTeamRecord } from "../../types";
import { TeamLink } from "../shared/TeamLink";
import { TeamLogo } from "../shared/TeamLogo";
import { Tone, teamGamesRecord, toneOf } from "./playerUtils";
import { Button } from "../../ui/Button";
import styles from "./TeamGrid.module.css";

const TONE_CLASS: Record<Tone, string | undefined> = {
  good: styles.good,
  bad: styles.bad,
  neutral: undefined,
};

const line = (label: string, record?: { wins: number; losses: number }) => (
  <span className={styles.line}>
    {label}{" "}
    <b className={styles.record}>
      {record && record.wins + record.losses > 0
        ? `${record.wins}-${record.losses}`
        : "–"}
    </b>
  </span>
);

const hasGames = (entry?: UserTeamRecord) =>
  !!entry && entry.picked.picks + entry.against.picks > 0;

// One team's tile: the player's record picking them ("For") and picking
// their opponent ("Vs"), tinted by the two added together (toneOf).
const TeamTile = ({
  team,
  entry,
}: {
  team: TeamRef;
  entry?: UserTeamRecord;
}) => {
  const both = teamGamesRecord(entry);
  return (
    <TeamLink
      abbr={team.abbr}
      className={[
        styles.tile,
        !hasGames(entry) && styles.noGames,
        TONE_CLASS[toneOf(both.wins, both.losses)],
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <TeamLogo abbr={team.abbr} size={20} decorative />
      <span className={styles.abbr}>{team.abbr}</span>
      {line("For", entry?.picked)}
      {line("Vs", entry?.against)}
    </TeamLink>
  );
};

// The teams the player has picked, either side, most games first. "Show
// all 32" lays every team out like the standings, a column per division,
// so the gaps are visible too.
export function TeamGrid({
  standings,
  teams,
}: {
  standings: NflStandings;
  teams: UserTeamRecord[];
}) {
  const [showAll, setShowAll] = useState(false);
  const divisions = standings.conferences.flatMap((c) => c.divisions);
  const picked = teams
    .filter(hasGames)
    .sort(
      (a, b) =>
        b.picked.picks + b.against.picks - (a.picked.picks + a.against.picks)
    );
  const all = showAll || picked.length === 0;

  return (
    <div className={styles.grid}>
      {all ? (
        <div className={styles.divisions}>
          {divisions.map((division) => (
            <div
              key={division.name}
              role="group"
              aria-label={division.name}
              className={styles.division}
            >
              <p aria-hidden className={styles.divisionName}>
                {division.name}
              </p>
              {division.teams.map(({ team }) => (
                <TeamTile
                  key={team.id}
                  team={team}
                  entry={teams.find((t) => t.team.id === team.id)}
                />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.picked}>
          {picked.map((entry) => (
            <TeamTile key={entry.team.id} team={entry.team} entry={entry} />
          ))}
        </div>
      )}
      {picked.length > 0 && (
        <Button
          size="small"
          onClick={() => setShowAll((v) => !v)}
          className={styles.toggle}
        >
          {showAll ? "Only teams picked" : "Show all 32"}
        </Button>
      )}
    </div>
  );
}
