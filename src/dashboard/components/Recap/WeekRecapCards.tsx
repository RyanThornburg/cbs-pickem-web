import { Fragment } from "react";
import { ordinal } from "../../helper";
import { RecapItem, RecapMove, RecapPerson } from "../../types";
import { TeamLogo } from "../shared/TeamLogo";
import { CategoryMark } from "./recapCategory";
import { WeekCard } from "./weekCards";
import styles from "./WeekRecapCards.module.css";

// Renderers for the Trends recap cards (Week and Season). Each reads its
// items' `data` (shapes per the data repo's recap reference, version 3);
// anything without a dedicated card falls back to its headlines. Week and
// Season each show one scope only, so cards carry no "This week"/"Season"
// tag.

interface TeamRef {
  id: number;
  abbr: string;
  name: string;
}

const pct = (n: number) => `${Math.round(n * 100)}%`;
const byKind = (card: WeekCard, kind: string, scope?: "week" | "season") =>
  card.items.find((t) => t.kind === kind && (!scope || t.scope === scope));
const record = (d: Record<string, unknown>) =>
  `${d.wins}-${d.losses}${d.pushes ? `-${d.pushes}` : ""}`;

export function CardShell({
  title,
  category,
  children,
  highlight,
}: {
  title: string;
  category: string;
  children: React.ReactNode;
  // The selected player's own card: tinted like their row on User Picks.
  highlight?: boolean;
}) {
  return (
    <div
      className={highlight ? `${styles.card} ${styles.highlight}` : styles.card}
    >
      <div className={styles.cardHead}>
        <CategoryMark category={category} />
        <h4 className={styles.cardTitle}>{title}</h4>
      </div>
      {children}
    </div>
  );
}

export function Big({ value, suffix }: { value: string; suffix?: string }) {
  return (
    <p className={styles.big}>
      {value} {suffix && <span className={styles.bigSuffix}>{suffix}</span>}
    </p>
  );
}

export const Sub = ({ children }: { children: React.ReactNode }) => (
  <p className={styles.sub}>{children}</p>
);

// Label/value pairs, e.g. the chaos index parts.
function Parts({ rows }: { rows: [React.ReactNode, React.ReactNode][] }) {
  return (
    <div className={styles.parts}>
      {rows.map(([label, value], i) => (
        <Fragment key={i}>
          <span>{label}</span>
          <span className={styles.partValue}>{value}</span>
        </Fragment>
      ))}
    </div>
  );
}

// Gold is for honors only (a 5-0 week, same as the 5-0 badge on User
// Picks); 0-5 is a loss; anything else, like an upset's believers, is plain.
// The tones are in WeekRecapCards.module.css.
const CHIP_TONES = {
  honor: styles.honor,
  lost: styles.lost,
  plain: styles.plain,
};

function PersonChips({
  people,
  tone,
  selectedUserId,
}: {
  people: RecapPerson[];
  tone: keyof typeof CHIP_TONES;
  selectedUserId?: string;
}) {
  return (
    <div className={styles.chips}>
      {people.map((p) => {
        const you = String(p.user_id) === selectedUserId;
        return (
          <span
            key={p.user_id}
            className={[styles.chip, CHIP_TONES[tone], you && styles.chipYou]
              .filter(Boolean)
              .join(" ")}
          >
            {p.name}
            {you && " (you)"}
          </span>
        );
      })}
    </div>
  );
}

function ChaosCard({ item }: { item: RecapItem }) {
  const d = item.data as Record<string, number | boolean | null>;
  const index = d.index as number;
  const partial = !!d.partial;
  const rank = d.season_rank as number | null;
  const at = `${Math.min(100, Math.max(0, index * 10))}%`;
  return (
    <CardShell title="Chaos index" category="chaos">
      <Big
        value={index.toFixed(1)}
        suffix={`/ 10${partial ? ` · so far, ${d.games_final} of ${d.games_total} final` : ""}${
          rank && !partial
            ? ` · ${rank === 1 ? "most chaotic" : `${ordinal(rank)} of ${d.weeks_ranked}`}`
            : ""
        }`}
      />
      {/* Neutral meter: chaos isn't a win or a loss, so no traffic-light
          gradient. */}
      <div
        role="img"
        aria-label={`Chaos index ${index.toFixed(1)} out of 10`}
        className={styles.meter}
      >
        <div className={styles.meterFill} style={{ width: at }} />
        <div className={styles.meterMark} style={{ left: at }} />
      </div>
      <div className={styles.meterEnds}>
        <span>Favorites held</span>
        <span>Upsets everywhere</span>
      </div>
      <Parts
        rows={[
          ["Underdogs covered", `${d.underdog_covers} of ${d.ats_decided}`],
          ["Outright upsets", String(d.outright_upsets)],
          [
            "Favorites of 7+ that lost",
            `${d.big_favorite_losses} of ${d.big_favorites}`,
          ],
        ]}
      />
    </CardShell>
  );
}

function AccuracyCard({
  card,
  selectedUserId,
}: {
  card: WeekCard;
  selectedUserId?: string;
}) {
  const acc = byKind(card, "pool_accuracy");
  const perfectItem = byKind(card, "perfect_week");
  const perfect = (perfectItem?.data.users ?? []) as RecapPerson[];
  const winless = (byKind(card, "winless_week")?.data.users ??
    []) as RecapPerson[];
  const d = (acc?.data ?? {}) as Record<string, number | string | null>;
  const note =
    d.season_rank_note === "worst"
      ? "Worst week this season"
      : d.season_rank_note === "best"
        ? "Best week this season"
        : null;
  return (
    <CardShell title="Pool accuracy" category="pool">
      {acc && <Big value={pct(d.accuracy as number)} suffix="of picks right" />}
      {note && <Sub>{note}</Sub>}
      {/* The perfect_week item only exists once someone went 5-0, or once
          the week is complete with nobody at 5-0. */}
      {perfectItem && (
        <PeopleLine label="5-0">
          {perfect.length ? (
            <PersonChips
              people={perfect}
              tone="honor"
              selectedUserId={selectedUserId}
            />
          ) : (
            <Sub>nobody</Sub>
          )}
        </PeopleLine>
      )}
      {winless.length > 0 && (
        <PeopleLine label="0-5">
          <PersonChips
            people={winless}
            tone="lost"
            selectedUserId={selectedUserId}
          />
        </PeopleLine>
      )}
    </CardShell>
  );
}

function PeopleLine({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.peopleLine}>
      <p className={styles.peopleLabel}>{label}</p>
      <div className={styles.peopleList}>{children}</div>
    </div>
  );
}

interface CrowdGame {
  crowd_team: TeamRef;
  pick_count: number;
  result: "win" | "loss" | "push";
}

// Two records under one label, big enough to read at a glance.
function RecordRows({
  label,
  rows,
}: {
  label: string;
  rows: [string, string][];
}) {
  return (
    <div>
      <p className={styles.recordLabel}>{label}</p>
      <div className={styles.records}>
        {rows.map(([name, value]) => (
          <Fragment key={name}>
            <p className={styles.recordName}>{name}</p>
            <p className={styles.recordValue}>{value}</p>
          </Fragment>
        ))}
      </div>
    </div>
  );
}

// Popular picks only: "teams 10+ of you picked" is easy to read at a glance,
// where the per-game crowd record (whichever side more of you took, even
// 3 vs 2) needed explaining. The crowd record stays in the full list; it's
// only used here when there are no popular-pick items.
function CrowdCard({ card }: { card: WeekCard }) {
  const popular = byKind(card, "popular_picks", "week");
  const popularSeason = byKind(card, "popular_picks", "season");
  const week = byKind(card, "crowd_record", "week");
  const season = byKind(card, "crowd_record", "season");
  // The week's cutoff (30% of the pool, rounded up); falls back to the
  // season's latest week when there's no weekly item.
  const byWeek = (popularSeason?.data.min_picks_by_week ?? {}) as Record<
    string,
    number
  >;
  const minPicks =
    (popular?.data.min_picks as number | undefined) ??
    byWeek[Object.keys(byWeek).sort((a, b) => Number(b) - Number(a))[0]] ??
    10;
  const rows = (w: RecapItem | undefined, sn: RecapItem | undefined) => [
    ...(w ? [["This week", record(w.data)] as [string, string]] : []),
    ...(sn ? [["This season", record(sn.data)] as [string, string]] : []),
  ];
  const usePopular = !!(popular || popularSeason);
  const top = ((popular?.data.games ?? []) as CrowdGame[])[0];
  const resultClass = {
    win: styles.win,
    loss: styles.loss,
    push: styles.push,
  };
  const resultText = { win: "covered", loss: "didn't cover", push: "pushed" };
  return (
    <CardShell title="Popular picks" category="crowd">
      {usePopular ? (
        <>
          <RecordRows
            label={`Teams ${minPicks}+ of you picked`}
            rows={rows(popular, popularSeason)}
          />
          {top && (
            <div className={styles.mostPicked}>
              <TeamLogo abbr={top.crowd_team.abbr} size={16} />
              <span>
                Most picked: {top.crowd_team.abbr} ({top.pick_count}){" "}
                <span className={`${styles.result} ${resultClass[top.result]}`}>
                  {resultText[top.result]}
                </span>
              </span>
            </div>
          )}
        </>
      ) : (
        <RecordRows
          label="The side more of you took"
          rows={rows(week, season)}
        />
      )}
    </CardShell>
  );
}

function SpreadSeasonCard({ item }: { item: RecapItem }) {
  const d = item.data as Record<string, number>;
  const decided = d.games - (d.pushes ?? 0);
  return (
    <CardShell title="Just pick the winner?" category="spread">
      <Big value={pct(d.winner_covered / Math.max(1, decided))} />
      <Sub>
        of game winners also covered ({d.winner_covered} of {decided} games)
      </Sub>
    </CardShell>
  );
}

// Pool splits and league-wide cover trends: one bar per item against 50%.
function SplitsCard({ card, title }: { card: WeekCard; title: string }) {
  return (
    <CardShell title={title} category={card.items[0].category}>
      <div className={styles.splits}>
        {card.items.map((t) => {
          const d = t.data as Record<string, number | string>;
          const p = Number(d.pct);
          const label = typeof d.label === "string" ? d.label : t.short;
          return (
            <div key={t.id} title={t.headline}>
              <div className={styles.splitRow}>
                <span className={styles.splitLabel}>
                  {label.charAt(0).toUpperCase() + label.slice(1)}
                </span>
                <span className={styles.splitValue}>
                  {d.successes}-{Number(d.n) - Number(d.successes)} · {pct(p)}
                </span>
              </div>
              <div className={styles.splitBar}>
                <div
                  className={styles.splitFill}
                  style={{ width: `${p * 100}%` }}
                />
                <div className={styles.splitTick} />
              </div>
            </div>
          );
        })}
      </div>
    </CardShell>
  );
}

function UpsetCard({
  item,
  selectedUserId,
}: {
  item: RecapItem;
  selectedUserId?: string;
}) {
  const d = item.data as Record<string, unknown>;
  const dog = d.underdog as TeamRef;
  const fav = d.favorite as TeamRef;
  const home = d.home_team as TeamRef;
  const dogScore = dog.id === home.id ? d.home_score : d.away_score;
  const favScore = dog.id === home.id ? d.away_score : d.home_score;
  const believers = (d.believers ?? []) as RecapPerson[];
  return (
    <CardShell title="Upset of the week" category="chaos">
      <div className={styles.upsetRows}>
        {[
          [fav, `−${d.points}`, favScore, false],
          [dog, `+${d.points}`, dogScore, true],
        ].map(([team, line, score, won]) => (
          <div key={(team as TeamRef).id} className={styles.upsetRow}>
            <TeamLogo abbr={(team as TeamRef).abbr} size={22} />
            <p className={styles.upsetTeam}>
              {(team as TeamRef).abbr}{" "}
              <span className={styles.upsetLine}>{line as string}</span>
            </p>
            <p
              className={
                won
                  ? styles.upsetScore
                  : `${styles.upsetScore} ${styles.upsetScoreLost}`
              }
            >
              {score as number}
            </p>
          </div>
        ))}
      </div>
      <Sub>
        {believers.length} of the {String(d.pool_picks)} who picked this game
        had {dog.abbr}.
      </Sub>
      {believers.length > 0 && (
        <PersonChips
          people={believers}
          tone="plain"
          selectedUserId={selectedUserId}
        />
      )}
    </CardShell>
  );
}

function MoversCard({ card }: { card: WeekCard }) {
  const moves = card.items.flatMap((t) => (t.data.moves ?? []) as RecapMove[]);
  return (
    <CardShell title="Biggest movers" category="users">
      <div className={styles.moves}>
        {moves.map((m) => (
          <div key={m.user_id} className={styles.move}>
            <span
              className={`${styles.moveChip} ${m.change > 0 ? styles.moveUp : styles.moveDown}`}
            >
              {m.change > 0 ? "▲" : "▼"}
              {Math.abs(m.change)}
            </span>
            <span className={styles.moveName}>{m.name}</span>
            <span className={styles.moveRanks}>
              {ordinal(m.rank_before)} → {ordinal(m.rank_after)}
            </span>
          </div>
        ))}
      </div>
    </CardShell>
  );
}

// Teams covering (or missing) 3+ straight, one line per streak type.
function StreaksCard({ card }: { card: WeekCard }) {
  return (
    <CardShell title="Cover streaks" category="teams">
      <div className={styles.streaks}>
        {card.items.map((t) => {
          const teams = (t.data.teams ?? []) as TeamRef[];
          const miss = t.data.streak_type === "miss";
          return (
            <div key={t.id}>
              <p className={styles.streakLabel}>
                {miss ? "Missed" : "Covered"} {String(t.data.length)} straight
              </p>
              <div className={styles.streakTeams}>
                {teams.map((team) => (
                  <div key={team.id} className={styles.streakTeam}>
                    <TeamLogo abbr={team.abbr} size={18} />
                    <p className={styles.streakAbbr}>{team.abbr}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </CardShell>
  );
}

// Anything without a dedicated card: its headlines. The first item's short
// version is the title, so its full headline only shows when it adds
// something (not when it's the same sentence with a few more words).
function HeadlineCard({ card }: { card: WeekCard }) {
  const first = card.items[0];
  const body = card.items.filter(
    (t, i) => i > 0 || t.headline.length - t.short.length > 20
  );
  return (
    <CardShell title={first.short} category={first.category}>
      {body.map((t) => (
        <Sub key={t.id}>{t.headline}</Sub>
      ))}
    </CardShell>
  );
}

export function WeekRecapCard({
  card,
  selectedUserId,
}: {
  card: WeekCard;
  selectedUserId?: string;
}) {
  const first = card.items[0];
  switch (card.group) {
    case "chaos":
      return <ChaosCard item={first} />;
    case "accuracy":
      return <AccuracyCard card={card} selectedUserId={selectedUserId} />;
    case "crowd":
      return <CrowdCard card={card} />;
    case "spreadSeason":
      return <SpreadSeasonCard item={first} />;
    case "splits":
      return <SplitsCard card={card} title="Where the pool wins and loses" />;
    case "league":
      return <SplitsCard card={card} title="League-wide cover trends" />;
    case "upset":
      return <UpsetCard item={first} selectedUserId={selectedUserId} />;
    case "movers":
      return <MoversCard card={card} />;
    case "streaks":
      return <StreaksCard card={card} />;
    default:
      return <HeadlineCard card={card} />;
  }
}
