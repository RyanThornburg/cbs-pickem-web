import { CSSProperties, useState } from "react";
import { GameWithOdds } from "../../data/GetGamesTabData";
import { GameStatus, RecapCoverStreak } from "../../types";
import CoverStreaks from "./CoverStreaks";
import { getTeamData } from "../../utils/teamAssets";
import { formatGameDate, formatGameTime } from "../Scoreboard/utils/dateFormatters";
import BookOddsTable from "./BookOddsTable";
import VenueBadge from "./VenueBadge";
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
      <span className="gc-mname">{data.name}</span>
      <span className="gc-rec">{formatRecord(team.record)}</span>
      {score != null && (
        <span className={`gc-final-score${covered ? " covered" : ""}`}>
          <span className="gc-score-num">{score}</span>
          <span className="gc-score-check" aria-hidden={!covered}>
            {covered ? "✓" : ""}
          </span>
        </span>
      )}
    </div>
  );
}

// Teams stack tight on the left with kickoff beside them (spanning both
// rows); weather gets its own full-width row below, so neither squeezes the
// other -- the teams no longer share a column with the weather block.
function GameCardItem({ game, streaks }: { game: GameWithOdds; streaks: Props["streaks"] }) {
  const [open, setOpen] = useState(false);
  const total = modeTotal(game.books);
  const vSide = getValueSide(game);
  const move = getMoveDelta(game);
  const isFinal = game.status === GameStatus.Final;
  const totalResult = isFinal ? getTotalResult(game, total) : null;
  const coverSide =
    isFinal && game.market_spread?.close != null && game.coveringTeamId != null
      ? game.coveringTeamId === game.home_team.id
        ? "good"
        : "bad"
      : "";

  return (
    <div className="gc-gamecard">
      <div className="gc-gamecard-top">
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
        <div className="gc-kickoff">
          <span className="gc-time">{formatGameTime(game.game_time)}</span>
          <span className="gc-tv">
            {formatGameDate(game.game_time)}
            {isFinal ? " · Final" : game.tv_network ? ` · ${game.tv_network}` : ""}
          </span>
          <VenueBadge stadium={game.stadium} neutralSite={game.neutral_site} />
        </div>
        <CoverStreaks streaks={[streaks.get(game.away_team.id), streaks.get(game.home_team.id)]} />
      </div>

      <div className="gc-gamecard-wx">
        <WeatherCell forecast={game.forecast} stadium={game.stadium} />
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
          <span className="gc-val">
            <span className={`gc-num ${coverSide}`}>
              {fmtSpread(game.market_spread?.close)}
            </span>
            {move != null && (
              <span className="gc-movebadge">
                {move > 0 ? "▲" : "▼"} {Math.abs(move)} pt move
              </span>
            )}
          </span>
        </div>
        <div className="gc-cell">
          <span className="gc-lbl">Total</span>
          <span className="gc-val">
            {total ?? "—"}
            {totalResult && (
              <span
                className="gc-total-hit"
                title={totalResult === "over" ? "Total went over" : "Total went under"}
              >
                {totalResult === "over" ? "▲" : "▼"}
              </span>
            )}
          </span>
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

export default function GamesListMobile({ games, streaks }: Props) {
  if (!games.length) {
    return <p style={{ color: "var(--gc-text-muted)" }}>No games scheduled.</p>;
  }

  return (
    <div className="gc-cardlist">
      {games.map((game) => (
        <GameCardItem key={game.game_id} game={game} streaks={streaks} />
      ))}
    </div>
  );
}
