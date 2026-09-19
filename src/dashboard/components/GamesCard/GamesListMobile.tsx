import { CSSProperties, useState } from "react";
import { GameWithOdds } from "../../data/GetGamesTabData";
import { getTeamData } from "../../utils/teamAssets";
import { formatGameDate, formatGameTime } from "../Scoreboard/utils/dateFormatters";
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

// Kickoff/weather sit next to the team they belong under (away row / home
// row) rather than off to one side, so the pairing reads as one unit on a
// narrow screen instead of two separate blocks the eye has to reconcile.
function GameCardItem({ game }: { game: GameWithOdds }) {
  const [open, setOpen] = useState(false);
  const total = modeTotal(game.books);
  const vSide = getValueSide(game);
  const move = getMoveDelta(game);

  return (
    <div className="gc-gamecard">
      <div className="gc-gamecard-top">
        <TeamRow team={game.away_team} />
        <div className="gc-kickoff" style={{ textAlign: "right" }}>
          <span className="gc-time">{formatGameTime(game.game_time)}</span>
          <span className="gc-tv">
            {formatGameDate(game.game_time)}
            {game.tv_network ? ` · ${game.tv_network}` : ""}
          </span>
        </div>
        <TeamRow team={game.home_team} />
        <div style={{ textAlign: "right" }}>
          <WeatherCell forecast={game.forecast} stadium={game.stadium} />
        </div>
      </div>

      {/* Open/Spread on top, Total/CBS Line below -- the market's current
          number lines up directly above the pool's line for comparison. */}
      <div className="gc-oddsgrid">
        <div className="gc-cell">
          <span className="gc-lbl">Open</span>
          <span className="gc-val">{fmtSpread(game.market_spread?.open)}</span>
        </div>
        <div className="gc-cell">
          <span className="gc-lbl">Spread</span>
          <span className="gc-val">{fmtSpread(game.market_spread?.close)}</span>
        </div>
        <div className="gc-cell">
          <span className="gc-lbl">Total</span>
          <span className="gc-val">{total ?? "—"}</span>
        </div>
        <div className="gc-cell">
          <span className="gc-lbl">CBS Line</span>
          <span className="gc-val">
            {fmtSpread(game.cbs_spread)}
            {vSide && (
              <span className={`gc-valuearrow ${vSide === "home" ? "good" : "bad"}`}>
                {vSide === "home" ? "▲" : "▼"}{" "}
                {vSide === "home" ? game.home_team.abbr : game.away_team.abbr}
              </span>
            )}
            {move != null && (
              <span className="gc-movebadge">
                {move > 0 ? "▲" : "▼"} {Math.abs(move)} pt move
              </span>
            )}
          </span>
        </div>
      </div>

      <button className="gc-expandbtn" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        Books <span className="gc-arrow">▾</span>
      </button>
      {open && (
        <div className="gc-bookdetail-mobile">
          <BookOddsTable
            books={game.books}
            homeAbbr={game.home_team.abbr}
            awayAbbr={game.away_team.abbr}
          />
        </div>
      )}
    </div>
  );
}

export default function GamesListMobile({ games }: Props) {
  if (!games.length) {
    return <p style={{ color: "var(--gc-text-muted)" }}>No games scheduled.</p>;
  }

  return (
    <div className="gc-cardlist">
      {games.map((game) => (
        <GameCardItem key={game.game_id} game={game} />
      ))}
    </div>
  );
}
