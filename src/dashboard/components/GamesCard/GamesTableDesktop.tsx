import { CSSProperties, useId, useState } from "react";
import { GameWithOdds } from "../../data/GetGamesTabData";
import { GameStatus, RecapCoverStreak } from "../../types";
import CoverStreaks from "./CoverStreaks";
import { getTeamData } from "../../utils/teamAssets";
import { formatGameShort } from "../Scoreboard/utils/dateFormatters";
import BookOddsTable from "./BookOddsTable";
import VenueBadge from "./VenueBadge";
import WeatherCell from "./WeatherCell";
import {
  cbsCoverNote,
  edgePoints,
  edgeTitle,
  fmtTeamLine,
  formatRecord,
  getMoveDelta,
  getTotalResult,
  getValueSide,
  modeTotal,
  moveTowardAbbr,
} from "./gamesCardUtils";

type Props = {
  games: GameWithOdds[];
  // Active cover/miss streaks of 3+, by team id (from the week's recap).
  streaks: Map<number, RecapCoverStreak>;
};

function TeamRow({
  team,
  score,
  covered,
}: {
  team: GameWithOdds["home_team"];
  score?: number;
  covered?: boolean;
}) {
  const data = getTeamData(team.abbr);
  const chipStyle = { "--gc-chip-color": `#${data.color}` } as CSSProperties;
  return (
    <div className="gc-mrow">
      <span className="gc-chip" style={chipStyle}>
        {team.abbr}
      </span>
      <span>{data.name}</span>
      <span className="gc-rec">{formatRecord(team.record)}</span>
      {score != null && (
        <span className={`gc-final-score${covered ? " covered" : ""}`}>
          <span className="gc-score-num">{score}</span>
          {/* Always rendered, just hidden when not covering -- reserves the
              same width either way so the number itself stays aligned across
              rows instead of shifting left when a checkmark is present. */}
          <span className="gc-score-check" aria-hidden={!covered}>
            {covered ? "✓" : ""}
          </span>
        </span>
      )}
    </div>
  );
}

// Every line is written as the favorite gives it ("PIT −3"); the feed's
// numbers are all the home team's. The CBS line (the one the pool scores
// against) comes first and biggest; Vegas follows as the comparison, with
// the open line and the O/U total folded into its cell rather than taking
// their own columns, which frees width for the Weather column.
function SpreadCell({ game }: { game: GameWithOdds }) {
  const move = getMoveDelta(game);
  const isFinal = game.status === GameStatus.Final;
  const total = modeTotal(game.books);
  const totalResult = isFinal ? getTotalResult(game, total) : null;
  // No market data at all for this game (seen on week 1's opener): one dash,
  // not "— / Opened — / O/U —".
  if (
    game.market_spread?.close == null &&
    game.market_spread?.open == null &&
    total == null
  ) {
    return <span className="gc-num">—</span>;
  }
  return (
    <div className="gc-line">
      <span className="gc-num">
        {fmtTeamLine(game.market_spread?.close, game)}
      </span>
      <span className="gc-linesub">
        Opened {fmtTeamLine(game.market_spread?.open, game)}
      </span>
      {move != null && (
        <span
          className="gc-movebadge"
          title={`Vegas line moved ${Math.abs(move)} toward ${moveTowardAbbr(game, move)} since it opened`}
        >
          Moved {Math.abs(move)} to {moveTowardAbbr(game, move)}
        </span>
      )}
      <span className="gc-ou">
        O/U <span className="gc-ou-num">{total ?? "—"}</span>
        {totalResult && (
          <span className="gc-total-hit">
            {" · "}
            {totalResult === "over" ? "Over" : "Under"}
          </span>
        )}
      </span>
    </div>
  );
}

function CbsLineCell({ game }: { game: GameWithOdds }) {
  const vSide = getValueSide(game);
  const cover = cbsCoverNote(game);
  return (
    <div className="gc-line">
      <span className="gc-num gc-hero">
        {fmtTeamLine(game.cbs_spread, game)}
      </span>
      {cover && (
        <span className={`gc-cover${cover === "Push" ? " push" : ""}`}>
          {cover}
        </span>
      )}
      {vSide && (
        <span className="gc-edge" title={edgeTitle(game, vSide)}>
          {vSide === "home" ? game.home_team.abbr : game.away_team.abbr} edge{" "}
          {edgePoints(game)}
          <span className="gc-sr">: {edgeTitle(game, vSide)}</span>
        </span>
      )}
    </div>
  );
}

function GameRow({
  game,
  streaks,
}: {
  game: GameWithOdds;
  streaks: Props["streaks"];
}) {
  const [open, setOpen] = useState(false);
  const booksId = useId();
  const isFinal = game.status === GameStatus.Final;

  return (
    <>
      <tr className="gc-row">
        <td>
          <div className="gc-matchup">
            <TeamRow
              team={game.away_team}
              score={isFinal ? game.away_score : undefined}
              covered={isFinal && game.coveringTeamId === game.away_team.id}
            />
            <TeamRow
              team={game.home_team}
              score={isFinal ? game.home_score : undefined}
              covered={isFinal && game.coveringTeamId === game.home_team.id}
            />
            <CoverStreaks
              streaks={[
                streaks.get(game.away_team.id),
                streaks.get(game.home_team.id),
              ]}
            />
          </div>
        </td>
        <td>
          <CbsLineCell game={game} />
        </td>
        <td>
          <SpreadCell game={game} />
        </td>
        <td>
          <div className="gc-kickoff">
            <span className="gc-time">{formatGameShort(game.game_time)}</span>
            <span className="gc-tv">
              {isFinal ? "Final" : (game.tv_network ?? "")}
            </span>
            <VenueBadge
              stadium={game.stadium}
              neutralSite={game.neutral_site}
            />
          </div>
        </td>
        <td>
          <WeatherCell forecast={game.forecast} stadium={game.stadium} />
        </td>
        <td>
          <button
            className="gc-expandbtn"
            aria-expanded={open}
            aria-controls={booksId}
            onClick={() => setOpen((v) => !v)}
          >
            Books{" "}
            <span className="gc-arrow" aria-hidden="true">
              ▾
            </span>
          </button>
        </td>
      </tr>
      {open && (
        <tr className="gc-bookdetail" id={booksId}>
          <td colSpan={6}>
            <BookOddsTable
              books={game.books}
              homeAbbr={game.home_team.abbr}
              awayAbbr={game.away_team.abbr}
            />
          </td>
        </tr>
      )}
    </>
  );
}

export default function GamesTableDesktop({ games, streaks }: Props) {
  if (!games.length) {
    return <p className="gc-empty">No games scheduled for this week.</p>;
  }

  return (
    <div className="gc-tablewrap">
      <table>
        <thead>
          <tr>
            <th style={{ width: "20%" }}>Matchup</th>
            <th style={{ width: "11%" }}>CBS line</th>
            <th style={{ width: "12%" }}>Vegas</th>
            <th style={{ width: "12%" }}>Kickoff</th>
            <th style={{ width: "33%" }}>Weather</th>
            <th>Books</th>
          </tr>
        </thead>
        <tbody>
          {games.map((game) => (
            <GameRow key={game.game_id} game={game} streaks={streaks} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
