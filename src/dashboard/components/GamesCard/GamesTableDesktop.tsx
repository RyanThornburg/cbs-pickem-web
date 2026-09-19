import { CSSProperties, useState } from "react";
import { GameWithOdds } from "../../data/GetGamesTabData";
import { GameStatus } from "../../types";
import { getTeamData } from "../../utils/teamAssets";
import { formatGameShort } from "../Scoreboard/utils/dateFormatters";
import BookOddsTable from "./BookOddsTable";
import WeatherCell from "./WeatherCell";
import {
  fmtSpread,
  formatRecord,
  getMoveDelta,
  getTotalResult,
  getValueSide,
  modeTotal,
} from "./gamesCardUtils";

type Props = {
  games: GameWithOdds[];
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

// Open, Spread, and CBS Line are all the home team's number -- that's the
// one convention throughout, no team abbreviation shown next to them.
function SpreadCell({ game }: { game: GameWithOdds }) {
  const move = getMoveDelta(game);
  const isFinal = game.status === GameStatus.Final;
  const coverSide =
    isFinal && game.market_spread?.close != null && game.coveringTeamId != null
      ? game.coveringTeamId === game.home_team.id
        ? "good"
        : "bad"
      : "";
  return (
    <div className="gc-line">
      <span className={`gc-num ${coverSide}`}>
        {fmtSpread(game.market_spread?.close)}
      </span>
      {move != null && (
        <span className="gc-movebadge">
          {move > 0 ? "▲" : "▼"} {Math.abs(move)} pt move since open
        </span>
      )}
    </div>
  );
}

function CbsLineCell({ game }: { game: GameWithOdds }) {
  const vSide = getValueSide(game);
  return (
    <div className="gc-line">
      <span className="gc-num">{fmtSpread(game.cbs_spread)}</span>
      {vSide && (
        <span className={`gc-valuearrow ${vSide === "home" ? "good" : "bad"}`}>
          {vSide === "home" ? "▲" : "▼"}{" "}
          {vSide === "home" ? game.home_team.abbr : game.away_team.abbr}
        </span>
      )}
    </div>
  );
}

function GameRow({ game }: { game: GameWithOdds }) {
  const [open, setOpen] = useState(false);
  const total = modeTotal(game.books);
  const isFinal = game.status === GameStatus.Final;
  const totalResult = isFinal ? getTotalResult(game, total) : null;

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
          </div>
        </td>
        <td>{fmtSpread(game.market_spread?.open)}</td>
        <td>
          <SpreadCell game={game} />
        </td>
        <td>
          <CbsLineCell game={game} />
        </td>
        <td>
          {total ?? "—"}
          {totalResult && (
            <span
              className="gc-total-hit"
              title={totalResult === "over" ? "Total went over" : "Total went under"}
            >
              {totalResult === "over" ? "▲" : "▼"}
            </span>
          )}
        </td>
        <td>
          <div className="gc-kickoff">
            <span className="gc-time">{formatGameShort(game.game_time)}</span>
            <span className="gc-tv">{isFinal ? "Final" : game.tv_network ?? ""}</span>
          </div>
        </td>
        <td>
          <WeatherCell forecast={game.forecast} stadium={game.stadium} />
        </td>
        <td>
          <button className="gc-expandbtn" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
            Books <span className="gc-arrow">▾</span>
          </button>
        </td>
      </tr>
      {open && (
        <tr className="gc-bookdetail">
          <td colSpan={8}>
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

export default function GamesTableDesktop({ games }: Props) {
  if (!games.length) {
    return <p style={{ color: "var(--gc-text-muted)" }}>No games scheduled.</p>;
  }

  return (
    <div className="gc-tablewrap">
      <table>
        <thead>
          <tr>
            <th style={{ width: "19%" }}>Matchup</th>
            <th style={{ width: "8%" }}>Open</th>
            <th style={{ width: "13%" }}>Spread</th>
            <th style={{ width: "9%" }}>CBS Line</th>
            <th style={{ width: "8%" }}>Total</th>
            <th style={{ width: "12%" }}>Kickoff</th>
            <th style={{ width: "18%" }}>Weather</th>
            <th>Books</th>
          </tr>
        </thead>
        <tbody>
          {games.map((game) => (
            <GameRow key={game.game_id} game={game} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
