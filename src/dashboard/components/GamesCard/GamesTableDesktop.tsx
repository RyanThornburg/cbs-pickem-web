import { CSSProperties, useState } from "react";
import { GameWithOdds } from "../../data/GetGamesTabData";
import { getTeamData } from "../../utils/teamAssets";
import { formatGameShort } from "../Scoreboard/utils/dateFormatters";
import BookOddsTable from "./BookOddsTable";
import WeatherCell from "./WeatherCell";
import {
  fmtSpread,
  formatRecord,
  getMoveDelta,
  getValueSide,
  modeTotal,
} from "./gamesCardUtils";

type Props = {
  games: GameWithOdds[];
};

function TeamRow({ team }: { team: GameWithOdds["home_team"] }) {
  const data = getTeamData(team.abbr);
  const chipStyle = { "--gc-chip-color": `#${data.color}` } as CSSProperties;
  return (
    <div className="gc-mrow">
      <span className="gc-chip" style={chipStyle}>
        {team.abbr}
      </span>
      <span>{data.name}</span>
      <span className="gc-rec">{formatRecord(team.record)}</span>
    </div>
  );
}

// Open, Spread, and CBS Line are all the home team's number -- that's the
// one convention throughout, no team abbreviation shown next to them.
function CbsLineCell({ game }: { game: GameWithOdds }) {
  const vSide = getValueSide(game);
  const move = getMoveDelta(game);
  return (
    <div className="gc-line">
      <span className="gc-num">{fmtSpread(game.cbs_spread)}</span>
      {vSide && (
        <span className={`gc-valuearrow ${vSide === "home" ? "good" : "bad"}`}>
          {vSide === "home" ? "▲" : "▼"}{" "}
          {vSide === "home" ? game.home_team.abbr : game.away_team.abbr}
        </span>
      )}
      {move != null && (
        <span className="gc-movebadge">
          {move > 0 ? "▲" : "▼"} {Math.abs(move)} pt move since open
        </span>
      )}
    </div>
  );
}

function GameRow({ game }: { game: GameWithOdds }) {
  const [open, setOpen] = useState(false);
  const total = modeTotal(game.books);

  return (
    <>
      <tr className="gc-row">
        <td>
          <div className="gc-matchup">
            <TeamRow team={game.away_team} />
            <TeamRow team={game.home_team} />
          </div>
        </td>
        <td>{fmtSpread(game.market_spread?.open)}</td>
        <td>{fmtSpread(game.market_spread?.close)}</td>
        <td>
          <CbsLineCell game={game} />
        </td>
        <td>{total ?? "—"}</td>
        <td>
          <div className="gc-kickoff">
            <span className="gc-time">{formatGameShort(game.game_time)}</span>
            <span className="gc-tv">{game.tv_network ?? ""}</span>
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
            <th style={{ width: "9%" }}>Spread</th>
            <th style={{ width: "13%" }}>CBS Line</th>
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
