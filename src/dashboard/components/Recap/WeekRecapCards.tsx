import { Box, Paper, Stack, Typography } from "@mui/material";
import { ordinal } from "../../helper";
import { RecapItem, RecapMove, RecapPerson } from "../../types";
import TeamLogo from "../TrendsSection/TeamLogo";
import { CategoryMark } from "./recapCategory";
import { WeekCard } from "./weekCards";

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
    <Paper
      variant="outlined"
      sx={{
        p: 1.5,
        display: "flex",
        flexDirection: "column",
        gap: 1,
        minWidth: 0,
        textAlign: "left",
        // DESIGN.md selected-lime, the selected player's row color.
        ...(highlight ? { bgcolor: "#f0f4c3", borderColor: "#d4dc8a" } : {}),
      }}
    >
      <Stack
        direction="row"
        spacing={1}
        sx={{
          alignItems: "center",
        }}
      >
        <CategoryMark category={category} />
        <Typography
          component="h3"
          sx={{ fontSize: "0.875rem", fontWeight: 700, flex: 1 }}
        >
          {title}
        </Typography>
      </Stack>
      {children}
    </Paper>
  );
}

export function Big({ value, suffix }: { value: string; suffix?: string }) {
  return (
    <Typography
      sx={{
        fontSize: "1.75rem",
        fontWeight: 800,
        lineHeight: 1.05,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {value}{" "}
      {suffix && (
        <Typography
          component="span"
          variant="body2"
          sx={{
            color: "text.secondary",
          }}
        >
          {suffix}
        </Typography>
      )}
    </Typography>
  );
}

export const Sub = ({ children }: { children: React.ReactNode }) => (
  <Typography
    variant="body2"
    sx={{
      color: "text.secondary",
      fontSize: "0.8125rem",
    }}
  >
    {children}
  </Typography>
);

// Label/value pairs, e.g. the chaos index parts.
function Parts({ rows }: { rows: [React.ReactNode, React.ReactNode][] }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "1fr auto",
        columnGap: 1.5,
        rowGap: 0.25,
        fontSize: "0.8125rem",
        color: "text.secondary",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {rows.map(([label, value], i) => (
        <Box key={i} sx={{ display: "contents" }}>
          <span>{label}</span>
          <Box
            component="span"
            sx={{ color: "text.primary", fontWeight: 600, textAlign: "right" }}
          >
            {value}
          </Box>
        </Box>
      ))}
    </Box>
  );
}

// Gold is for honors only (a 5-0 week, same as the 5-0 badge on User
// Picks); 0-5 is a loss; anything else, like an upset's believers, is plain.
const CHIP_TONES = {
  honor: { bgcolor: "hsl(45, 100%, 90%)", color: "hsl(35, 80%, 28%)" },
  // DESIGN.md streak-pill-end on a pale red: 5.6:1.
  lost: { bgcolor: "#ffebee", color: "#c62828" },
  // DESIGN.md slate-100 with ink.
  plain: { bgcolor: "hsl(220, 30%, 94%)", color: "rgba(0, 0, 0, 0.87)" },
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
    <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.5 }}>
      {people.map((p) => {
        const you = String(p.user_id) === selectedUserId;
        return (
          <Box
            key={p.user_id}
            component="span"
            sx={{
              fontSize: "0.75rem",
              fontWeight: you ? 800 : 600,
              borderRadius: 0.5,
              px: 0.75,
              py: "1px",
              ...CHIP_TONES[tone],
              // The selected player: an ink ring, plus "(you)" for screen
              // readers and anyone who can't see the ring.
              ...(you ? { boxShadow: "inset 0 0 0 1.5px currentColor" } : {}),
            }}
          >
            {p.name}
            {you && " (you)"}
          </Box>
        );
      })}
    </Stack>
  );
}

function ChaosCard({ item }: { item: RecapItem }) {
  const d = item.data as Record<string, number | boolean | null>;
  const index = d.index as number;
  const partial = !!d.partial;
  const rank = d.season_rank as number | null;
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
      <Box
        role="img"
        aria-label={`Chaos index ${index.toFixed(1)} out of 10`}
        sx={{
          position: "relative",
          height: 8,
          borderRadius: 1,
          bgcolor: "action.hover",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            width: `${Math.min(100, Math.max(0, index * 10))}%`,
            borderRadius: 1,
            // DESIGN.md slate-200.
            bgcolor: "hsl(220, 20%, 80%)",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            top: -4,
            left: `${Math.min(100, Math.max(0, index * 10))}%`,
            width: 4,
            height: 16,
            ml: "-2px",
            borderRadius: 0.5,
            bgcolor: "text.primary",
          }}
        />
      </Box>
      <Stack
        direction="row"
        sx={{
          justifyContent: "space-between",
          fontSize: "0.75rem",
          color: "text.secondary",
          mt: -0.5,
        }}
      >
        <span>Favorites held</span>
        <span>Upsets everywhere</span>
      </Stack>
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
    <Stack
      direction="row"
      spacing={1}
      sx={{
        alignItems: "flex-start",
      }}
    >
      <Typography
        sx={{
          fontSize: "0.8rem",
          fontWeight: 700,
          color: "text.secondary",
          minWidth: 26,
          lineHeight: "20px",
        }}
      >
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
function RecordRows({
  label,
  rows,
}: {
  label: string;
  rows: [string, string][];
}) {
  return (
    <Box>
      <Typography
        sx={{ fontSize: "0.8125rem", color: "text.secondary", mb: 0.5 }}
      >
        {label}
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr auto",
          columnGap: 2,
          rowGap: 0.25,
          alignItems: "baseline",
        }}
      >
        {rows.map(([name, value]) => (
          <Box key={name} sx={{ display: "contents" }}>
            <Typography variant="body2">{name}</Typography>
            <Typography
              sx={{
                fontWeight: 800,
                fontSize: "1.25rem",
                textAlign: "right",
                fontVariantNumeric: "tabular-nums",
              }}
            >
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
  const resultColor = {
    win: "success.main",
    loss: "error.main",
    push: "text.secondary",
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
            <Stack
              direction="row"
              spacing={0.75}
              sx={{
                alignItems: "center",
                fontSize: "0.8125rem",
                color: "text.secondary",
              }}
            >
              <TeamLogo abbr={top.crowd_team.abbr} size={16} />
              <span>
                Most picked: {top.crowd_team.abbr} ({top.pick_count}){" "}
                <Box
                  component="span"
                  sx={{ color: resultColor[top.result], fontWeight: 600 }}
                >
                  {resultText[top.result]}
                </Box>
              </span>
            </Stack>
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
      <Stack spacing={1}>
        {card.items.map((t) => {
          const d = t.data as Record<string, number | string>;
          const p = Number(d.pct);
          const label = typeof d.label === "string" ? d.label : t.short;
          return (
            <Box key={t.id} title={t.headline}>
              <Stack
                direction="row"
                spacing={1}
                sx={{
                  justifyContent: "space-between",
                  fontSize: "0.8125rem",
                }}
              >
                <Box component="span" sx={{ minWidth: 0 }}>
                  {label.charAt(0).toUpperCase() + label.slice(1)}
                </Box>
                <Box
                  component="span"
                  sx={{
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {d.successes}-{Number(d.n) - Number(d.successes)} · {pct(p)}
                </Box>
              </Stack>
              <Box
                sx={{
                  position: "relative",
                  height: 6,
                  mt: 0.25,
                  borderRadius: 1,
                  bgcolor: "action.hover",
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    width: `${p * 100}%`,
                    borderRadius: 1,
                    bgcolor: p < 0.5 ? "error.main" : "success.main",
                  }}
                />
                <Box
                  sx={{
                    position: "absolute",
                    left: "50%",
                    top: 0,
                    bottom: 0,
                    width: "1px",
                    bgcolor: "text.secondary",
                  }}
                />
              </Box>
            </Box>
          );
        })}
      </Stack>
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
      <Stack spacing={0.5}>
        {[
          [fav, `−${d.points}`, favScore, false],
          [dog, `+${d.points}`, dogScore, true],
        ].map(([team, line, score, won]) => (
          <Stack
            key={(team as TeamRef).id}
            direction="row"
            spacing={1}
            sx={{
              alignItems: "center",
            }}
          >
            <TeamLogo abbr={(team as TeamRef).abbr} size={22} />
            <Typography sx={{ fontWeight: 700, flex: 1 }}>
              {(team as TeamRef).abbr}{" "}
              <Typography
                component="span"
                variant="body2"
                sx={{
                  color: "text.secondary",
                }}
              >
                {line as string}
              </Typography>
            </Typography>
            <Typography
              sx={{
                fontWeight: 800,
                fontSize: "1.1rem",
                color: won ? "text.primary" : "text.disabled",
              }}
            >
              {score as number}
            </Typography>
          </Stack>
        ))}
      </Stack>
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
      <Stack spacing={0.5}>
        {moves.map((m) => (
          <Stack
            key={m.user_id}
            direction="row"
            spacing={1}
            sx={{
              alignItems: "center",
              fontSize: "0.82rem",
            }}
          >
            <Box
              component="span"
              sx={{
                fontWeight: 800,
                fontSize: "0.75rem",
                borderRadius: 0.5,
                px: 0.5,
                // DESIGN.md pick-won-fill / covered-green and a pale red /
                // streak-pill-end; the ▲/▼ carries the direction too.
                bgcolor: m.change > 0 ? "#e8f5e9" : "#ffebee",
                color: m.change > 0 ? "#2e7d32" : "#c62828",
              }}
            >
              {m.change > 0 ? "▲" : "▼"}
              {Math.abs(m.change)}
            </Box>
            <Box component="span" sx={{ flex: 1 }}>
              {m.name}
            </Box>
            <Box component="span" sx={{ color: "text.secondary" }}>
              {ordinal(m.rank_before)} → {ordinal(m.rank_after)}
            </Box>
          </Stack>
        ))}
      </Stack>
    </CardShell>
  );
}

// Teams covering (or missing) 3+ straight, one line per streak type.
function StreaksCard({ card }: { card: WeekCard }) {
  return (
    <CardShell title="Cover streaks" category="teams">
      <Stack spacing={1}>
        {card.items.map((t) => {
          const teams = (t.data.teams ?? []) as TeamRef[];
          const miss = t.data.streak_type === "miss";
          return (
            <Box key={t.id}>
              <Typography
                sx={{ fontSize: "0.8125rem", color: "text.secondary" }}
              >
                {miss ? "Missed" : "Covered"} {String(t.data.length)} straight
              </Typography>
              <Stack
                direction="row"
                sx={{ flexWrap: "wrap", columnGap: 1.25, rowGap: 0.5, mt: 0.5 }}
              >
                {teams.map((team) => (
                  <Stack
                    key={team.id}
                    direction="row"
                    spacing={0.5}
                    sx={{ alignItems: "center" }}
                  >
                    <TeamLogo abbr={team.abbr} size={18} />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {team.abbr}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          );
        })}
      </Stack>
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
