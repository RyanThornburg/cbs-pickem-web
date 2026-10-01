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
  openedChanged,
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
function GameCardItem({
  game,
  streaks,
}: {
  game: GameWithOdds;
  streaks: Props["streaks"];
}) {
  const [open, setOpen] = useState(false);
  const booksId = useId();
  const total = modeTotal(game.books);
  const vSide = getValueSide(game);
  const move = getMoveDelta(game);
  const isFinal = game.status === GameStatus.Final;
  const totalResult = isFinal ? getTotalResult(game, total) : null;
  const cover = cbsCoverNote(game);
  const hasVegas =
    game.market_spread?.close != null ||
    game.market_spread?.open != null ||
    total != null;

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
          {/* Weekday and time, then the channel (or "Final"), as on desktop:
              every game is in the browsed week, so no month/day. */}
          <span className="gc-time">{formatGameShort(game.game_time)}</span>
          {(isFinal || game.tv_network) && (
            <span className="gc-tv">{isFinal ? "Final" : game.tv_network}</span>
          )}
          <VenueBadge stadium={game.stadium} neutralSite={game.neutral_site} />
        </div>
        <CoverStreaks
          streaks={[
            streaks.get(game.away_team.id),
            streaks.get(game.home_team.id),
          ]}
        />
      </div>

      {/* The CBS line (the pool's) leads the card, above the weather, with
          Vegas on one line under it as the comparison. Every line names the
          favorite ("PIT −3"). */}
      <div className="gc-cbsblock">
        <span className="gc-lbl">CBS line</span>
        <div className="gc-cbsrow">
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
              {vSide === "home" ? game.home_team.abbr : game.away_team.abbr}{" "}
              edge {edgePoints(game)}
              <span className="gc-sr">: {edgeTitle(game, vSide)}</span>
            </span>
          )}
        </div>
        {hasVegas && (
          <span className="gc-linesub">
            Vegas {fmtTeamLine(game.market_spread?.close, game)} ·{" "}
            {openedChanged(game) && (
              <>opened {fmtTeamLine(game.market_spread?.open, game)} · </>
            )}
            <span className="gc-nowrap">
              O/U {total ?? "—"}
              {totalResult && (
                <span className="gc-total-hit">
                  {" · "}
                  {totalResult === "over" ? "Over" : "Under"}
                </span>
              )}
            </span>
          </span>
        )}
        {move != null && (
          <span
            className="gc-movebadge"
            title={`Vegas line moved ${Math.abs(move)} toward ${moveTowardAbbr(game, move)} since it opened`}
          >
            Moved {Math.abs(move)} to {moveTowardAbbr(game, move)}
          </span>
        )}
      </div>

      <div className="gc-gamecard-wx">
        <WeatherCell forecast={game.forecast} stadium={game.stadium} />
      </div>

      {game.books.length > 0 && (
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
      )}
      {open && game.books.length > 0 && (
        <div className="gc-bookdetail-mobile" id={booksId}>
          <BookOddsTable
            books={game.books}
            homeAbbr={game.home_team.abbr}
            awayAbbr={game.away_team.abbr}
            byBet
          />
        </div>
      )}
    </div>
  );
}

export default function GamesListMobile({ games, streaks }: Props) {
  if (!games.length) {
    return <p className="gc-empty">No games scheduled for this week.</p>;
  }

  return (
    <div className="gc-cardlist">
      {games.map((game) => (
        <GameCardItem key={game.game_id} game={game} streaks={streaks} />
      ))}
    </div>
  );
}
