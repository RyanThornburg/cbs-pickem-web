import { Box, Paper, Stack, Typography } from "@mui/material";
import { getOrdinal } from "../../helper";
import { Tidbit, TidbitMove, TidbitPerson } from "../../types";
import TeamLogo from "../TrendsSection/TeamLogo";
import { CategoryMark, ScopeTag } from "./tidbitCategory";
import { WeekCard } from "./weekCards";

// Renderers for the Trends › Week tidbit cards. Each reads its tidbits'
// `data` (shapes per the data repo's tidbits reference, version 2); anything
// without a dedicated card falls back to its headlines.

interface TeamRef {
  id: number;
  abbr: string;
  name: string;
}

const pct = (n: number) => `${Math.round(n * 100)}%`;
const byKind = (card: WeekCard, kind: string, scope?: "week" | "season") =>
  card.tidbits.find((t) => t.kind === kind && (!scope || t.scope === scope));
const record = (d: Record<string, unknown>) =>
  `${d.wins}-${d.losses}${d.pushes ? `-${d.pushes}` : ""}`;

function CardShell({
  title,
  category,
  scope,
  children,
}: {
  title: string;
  category: string;
  scope?: "week" | "season";
  children: React.ReactNode;
}) {
  return (
    <Paper variant="outlined" sx={{ p: 1.5, display: "flex", flexDirection: "column", gap: 1, minWidth: 0, textAlign: "left" }}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <CategoryMark category={category} />
        <Typography sx={{ fontSize: "0.85rem", fontWeight: 700, flex: 1 }}>{title}</Typography>
        {scope && <ScopeTag scope={scope} />}
      </Stack>
      {children}
    </Paper>
  );
}

function Big({ value, suffix }: { value: string; suffix?: string }) {
  return (
    <Typography sx={{ fontSize: "1.75rem", fontWeight: 800, lineHeight: 1.05, fontVariantNumeric: "tabular-nums" }}>
      {value}{" "}
      {suffix && (
        <Typography component="span" variant="body2" color="text.secondary">
          {suffix}
        </Typography>
      )}
    </Typography>
  );
}

const Sub = ({ children }: { children: React.ReactNode }) => (
  <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.8rem" }}>
    {children}
  </Typography>
);

// Label/value pairs, e.g. the chaos index parts.
function Parts({ rows }: { rows: [React.ReactNode, React.ReactNode][] }) {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "1fr auto", columnGap: 1.5, rowGap: 0.25, fontSize: "0.78rem", color: "text.secondary", fontVariantNumeric: "tabular-nums" }}>
      {rows.map(([label, value], i) => (
        <Box key={i} sx={{ display: "contents" }}>
          <span>{label}</span>
          <Box component="span" sx={{ color: "text.primary", fontWeight: 600, textAlign: "right" }}>
            {value}
          </Box>
        </Box>
      ))}
    </Box>
  );
}

function PersonChips({ people, tone }: { people: TidbitPerson[]; tone: "good" | "bad" }) {
  return (
    <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.5 }}>
      {people.map((p) => (
        <Box
          key={p.user_id}
          component="span"
          sx={{
            fontSize: "0.72rem",
            fontWeight: 600,
            borderRadius: 0.5,
            px: 0.75,
            py: "1px",
            bgcolor: tone === "good" ? "hsl(45, 100%, 90%)" : "hsl(0, 80%, 95%)",
            color: tone === "good" ? "hsl(35, 80%, 28%)" : "hsl(0, 65%, 42%)",
          }}
        >
          {p.name}
        </Box>
      ))}
    </Stack>
  );
}

function ChaosCard({ tidbit }: { tidbit: Tidbit }) {
  const d = tidbit.data as Record<string, number | boolean | null>;
  const index = d.index as number;
  const partial = !!d.partial;
  const rank = d.season_rank as number | null;
  return (
    <CardShell title="Chaos index" category="chaos" scope="week">
      <Big
        value={index.toFixed(1)}
        suffix={`/ 10${partial ? ` · so far, ${d.games_final} of ${d.games_total} final` : ""}${
          rank && !partial ? ` · ${rank === 1 ? "most chaotic" : `${rank}${getOrdinal(rank)} of ${d.weeks_ranked}`}` : ""
        }`}
      />
      <Box
        role="img"
        aria-label={`Chaos index ${index.toFixed(1)} out of 10`}
        sx={{ position: "relative", height: 8, borderRadius: 1, background: "linear-gradient(90deg, hsl(145, 45%, 75%), hsl(45, 90%, 65%), hsl(12, 80%, 55%))" }}
      >
        <Box sx={{ position: "absolute", top: -4, left: `${Math.min(100, Math.max(0, index * 10))}%`, width: 4, height: 16, ml: "-2px", borderRadius: 0.5, bgcolor: "text.primary" }} />
      </Box>
      <Stack direction="row" justifyContent="space-between" sx={{ fontSize: "0.68rem", color: "text.disabled", mt: -0.5 }}>
        <span>Chalk</span>
        <span>Chaos</span>
      </Stack>
      <Parts
        rows={[
          ["Underdogs covered", `${d.underdog_covers} of ${d.ats_decided}`],
          ["Outright upsets", String(d.outright_upsets)],
          ["Favorites of 7+ that lost", `${d.big_favorite_losses} of ${d.big_favorites}`],
          ["Pool accuracy", pct(d.pool_accuracy as number)],
        ]}
      />
    </CardShell>
  );
}

function AccuracyCard({ card }: { card: WeekCard }) {
  const acc = byKind(card, "pool_accuracy");
  const perfectTidbit = byKind(card, "perfect_week");
  const perfect = (perfectTidbit?.data.users ?? []) as TidbitPerson[];
  const winless = (byKind(card, "winless_week")?.data.users ?? []) as TidbitPerson[];
  const d = (acc?.data ?? {}) as Record<string, number | string | null>;
  const note = d.season_rank_note === "worst" ? "Worst week this season" : d.season_rank_note === "best" ? "Best week this season" : null;
  return (
    <CardShell title="Pool accuracy" category="pool" scope="week">
      {acc && <Big value={pct(d.accuracy as number)} suffix="of picks right" />}
      {note && <Sub>{note}</Sub>}
      {/* The perfect_week tidbit only exists once someone went 5-0, or once
          the week is complete with nobody at 5-0. */}
      {perfectTidbit && (
        <PeopleLine label="5-0">
          {perfect.length ? <PersonChips people={perfect} tone="good" /> : <Sub>nobody</Sub>}
        </PeopleLine>
      )}
      {winless.length > 0 && (
        <PeopleLine label="0-5">
          <PersonChips people={winless} tone="bad" />
        </PeopleLine>
      )}
    </CardShell>
  );
}

function PeopleLine({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Stack direction="row" spacing={1} alignItems="flex-start">
      <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: "text.secondary", minWidth: 26, lineHeight: "20px" }}>
        {label}
      </Typography>
      <Box sx={{ minWidth: 0 }}>{children}</Box>
    </Stack>
  );
}

interface CrowdGame {
  crowd_team: TeamRef;
  pick_count: number;
  result: "win" | "loss" | "push";
}

// Two records under one label, big enough to read at a glance.
function RecordRows({ label, rows }: { label: string; rows: [string, string][] }) {
  return (
    <Box>
      <Typography sx={{ fontSize: "0.8rem", color: "text.secondary", mb: 0.5 }}>{label}</Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr auto", columnGap: 2, rowGap: 0.25, alignItems: "baseline" }}>
        {rows.map(([name, value]) => (
          <Box key={name} sx={{ display: "contents" }}>
            <Typography variant="body2">{name}</Typography>
            <Typography sx={{ fontWeight: 800, fontSize: "1.25rem", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
              {value}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

// Popular picks only: "teams 10+ of you picked" is easy to read at a glance,
// where the per-game crowd record (whichever side more of you took, even
// 3 vs 2) needed explaining. The crowd record stays in "All tidbits"; it's
// only used here when there are no popular-pick tidbits.
function CrowdCard({ card }: { card: WeekCard }) {
  const popular = byKind(card, "popular_picks", "week");
  const popularSeason = byKind(card, "popular_picks", "season");
  const week = byKind(card, "crowd_record", "week");
  const season = byKind(card, "crowd_record", "season");
  // The week's cutoff (30% of the pool, rounded up); falls back to the
  // season's latest week when there's no weekly tidbit.
  const byWeek = (popularSeason?.data.min_picks_by_week ?? {}) as Record<string, number>;
  const minPicks =
    (popular?.data.min_picks as number | undefined) ??
    byWeek[Object.keys(byWeek).sort((a, b) => Number(b) - Number(a))[0]] ??
    10;
  const rows = (w: Tidbit | undefined, sn: Tidbit | undefined) => [
    ...(w ? [["This week", record(w.data)] as [string, string]] : []),
    ...(sn ? [["This season", record(sn.data)] as [string, string]] : []),
  ];
  const usePopular = !!(popular || popularSeason);
  const top = ((popular?.data.games ?? []) as CrowdGame[])[0];
  const resultColor = { win: "success.main", loss: "error.main", push: "text.secondary" };
  const resultText = { win: "covered", loss: "didn't cover", push: "pushed" };
  return (
    <CardShell title="Popular picks" category="crowd">
      {usePopular ? (
        <>
          <RecordRows label={`Teams ${minPicks}+ of you picked`} rows={rows(popular, popularSeason)} />
          {top && (
            <Stack direction="row" alignItems="center" spacing={0.75} sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
              <TeamLogo abbr={top.crowd_team.abbr} size={16} />
              <span>
                Most picked: {top.crowd_team.abbr} ({top.pick_count}){" "}
                <Box component="span" sx={{ color: resultColor[top.result], fontWeight: 600 }}>
                  {resultText[top.result]}
                </Box>
              </span>
            </Stack>
          )}
        </>
      ) : (
        <RecordRows label="The side more of you took" rows={rows(week, season)} />
      )}
    </CardShell>
  );
}

function SpreadSeasonCard({ tidbit }: { tidbit: Tidbit }) {
  const d = tidbit.data as Record<string, number>;
  const decided = d.games - (d.pushes ?? 0);
  return (
    <CardShell title="Just pick the winner?" category="spread" scope="season">
      <Big value={pct(d.winner_covered / Math.max(1, decided))} />
      <Sub>
        of game winners also covered ({d.winner_covered} of {decided} games)
      </Sub>
    </CardShell>
  );
}

// Pool splits and league-wide cover trends: one bar per tidbit against 50%.
function SplitsCard({ card, title }: { card: WeekCard; title: string }) {
  return (
    <CardShell title={title} category={card.tidbits[0].category} scope="season">
      <Stack spacing={1}>
        {card.tidbits.map((t) => {
          const d = t.data as Record<string, number | string>;
          const p = Number(d.pct);
          const label = typeof d.label === "string" ? d.label : t.short;
          return (
            <Box key={t.id} title={t.headline}>
              <Stack direction="row" justifyContent="space-between" spacing={1} sx={{ fontSize: "0.78rem" }}>
                <Box component="span" sx={{ minWidth: 0 }}>
                  {label.charAt(0).toUpperCase() + label.slice(1)}
                </Box>
                <Box component="span" sx={{ fontWeight: 600, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                  {d.successes}-{Number(d.n) - Number(d.successes)} · {pct(p)}
                </Box>
              </Stack>
              <Box sx={{ position: "relative", height: 6, mt: 0.25, borderRadius: 1, bgcolor: "action.hover", overflow: "hidden" }}>
                <Box sx={{ position: "absolute", inset: 0, width: `${p * 100}%`, borderRadius: 1, bgcolor: p < 0.5 ? "error.main" : "success.main" }} />
                <Box sx={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: "1px", bgcolor: "text.secondary" }} />
              </Box>
            </Box>
          );
        })}
      </Stack>
    </CardShell>
  );
}

function UpsetCard({ tidbit }: { tidbit: Tidbit }) {
  const d = tidbit.data as Record<string, unknown>;
  const dog = d.underdog as TeamRef;
  const fav = d.favorite as TeamRef;
  const home = d.home_team as TeamRef;
  const dogScore = dog.id === home.id ? d.home_score : d.away_score;
  const favScore = dog.id === home.id ? d.away_score : d.home_score;
  const believers = (d.believers ?? []) as TidbitPerson[];
  return (
    <CardShell title="Upset of the week" category="chaos" scope="week">
      <Stack spacing={0.5}>
        {[
          [fav, `−${d.points}`, favScore, false],
          [dog, `+${d.points}`, dogScore, true],
        ].map(([team, line, score, won]) => (
          <Stack key={(team as TeamRef).id} direction="row" alignItems="center" spacing={1}>
            <TeamLogo abbr={(team as TeamRef).abbr} size={22} />
            <Typography sx={{ fontWeight: 700, flex: 1 }}>
              {(team as TeamRef).abbr}{" "}
              <Typography component="span" variant="body2" color="text.secondary">
                {line as string}
              </Typography>
            </Typography>
            <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", color: won ? "text.primary" : "text.disabled" }}>
              {score as number}
            </Typography>
          </Stack>
        ))}
      </Stack>
      <Sub>
        {believers.length} of the {String(d.pool_picks)} who picked this game had {dog.abbr}.
      </Sub>
      {believers.length > 0 && <PersonChips people={believers} tone="good" />}
    </CardShell>
  );
}

function MoversCard({ card }: { card: WeekCard }) {
  const moves = card.tidbits.flatMap((t) => (t.data.moves ?? []) as TidbitMove[]);
  return (
    <CardShell title="Biggest movers" category="users" scope="week">
      <Stack spacing={0.5}>
        {moves.map((m) => (
          <Stack key={m.user_id} direction="row" alignItems="center" spacing={1} sx={{ fontSize: "0.82rem" }}>
            <Box component="span" sx={{ fontWeight: 800, fontSize: "0.72rem", borderRadius: 0.5, px: 0.5, bgcolor: m.change > 0 ? "hsl(145, 55%, 92%)" : "hsl(0, 80%, 95%)", color: m.change > 0 ? "hsl(145, 60%, 28%)" : "hsl(0, 65%, 42%)" }}>
              {m.change > 0 ? "▲" : "▼"}
              {Math.abs(m.change)}
            </Box>
            <Box component="span" sx={{ flex: 1 }}>
              {m.name}
            </Box>
            <Box component="span" sx={{ color: "text.secondary" }}>
              {m.rank_before}
              {getOrdinal(m.rank_before)} → {m.rank_after}
              {getOrdinal(m.rank_after)}
            </Box>
          </Stack>
        ))}
      </Stack>
    </CardShell>
  );
}

// Anything without a dedicated card: its headlines as-is.
function HeadlineCard({ card }: { card: WeekCard }) {
  const first = card.tidbits[0];
  return (
    <CardShell title={first.short} category={first.category} scope={first.scope}>
      {card.tidbits.map((t) => (
        <Sub key={t.id}>{t.headline}</Sub>
      ))}
    </CardShell>
  );
}

export function WeekTidbitCard({ card }: { card: WeekCard }) {
  const first = card.tidbits[0];
  switch (card.group) {
    case "chaos":
      return <ChaosCard tidbit={first} />;
    case "accuracy":
      return <AccuracyCard card={card} />;
    case "crowd":
      return <CrowdCard card={card} />;
    case "spreadSeason":
      return <SpreadSeasonCard tidbit={first} />;
    case "splits":
      return <SplitsCard card={card} title="Where the pool wins and loses" />;
    case "league":
      return <SplitsCard card={card} title="League-wide cover trends" />;
    case "upset":
      return <UpsetCard tidbit={first} />;
    case "movers":
      return <MoversCard card={card} />;
    default:
      return <HeadlineCard card={card} />;
  }
}
