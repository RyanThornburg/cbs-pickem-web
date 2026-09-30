import { Box, Paper, Stack, Typography } from "@mui/material";
import { HistoricalChampion, HistoricalRecords } from "../../types";
import {
  cleanName,
  closedSeasons,
  HALVES_FROM_SEASON,
  highestWinningScore,
  isUnknownChampion,
} from "./recordsUtils";
import { GOLD, YOU_TINT } from "./recordsTheme";

type TagTone = "gold" | "high" | "grey";

const TAG_COLORS: Record<TagTone, { bg: string; fg: string }> = {
  gold: { bg: GOLD, fg: "hsl(35, 80%, 15%)" },
  high: { bg: "hsl(145, 55%, 90%)", fg: "hsl(145, 60%, 22%)" },
  grey: { bg: "hsl(220, 20%, 88%)", fg: "hsl(220, 20%, 35%)" },
};

function Tag({ tone, children }: { tone: TagTone; children: React.ReactNode }) {
  const { bg, fg } = TAG_COLORS[tone];
  return (
    <Box
      component="span"
      sx={{
        alignSelf: "flex-start",
        fontSize: "0.65rem",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        borderRadius: 0.5,
        px: 0.75,
        py: "1px",
        bgcolor: bg,
        color: fg,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </Box>
  );
}

function Tile({
  children,
  variant = "plain",
}: {
  children: React.ReactNode;
  variant?: "plain" | "defending" | "muted" | "live";
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        flex: "0 0 158px",
        scrollSnapAlign: "start",
        p: 1.25,
        display: "flex",
        flexDirection: "column",
        gap: 0.4,
        ...(variant === "defending" && {
          borderColor: GOLD,
          background: `linear-gradient(180deg, hsl(45, 100%, 92%), transparent 70%)`,
        }),
        ...(variant === "muted" && { bgcolor: "background.default" }),
        ...(variant === "live" && {
          bgcolor: "background.default",
          borderStyle: "dashed",
        }),
      }}
    >
      {children}
    </Paper>
  );
}

const Year = ({ year }: { year: number }) => (
  <Typography sx={{ fontSize: "1.25rem", fontWeight: 800, lineHeight: 1.1 }}>
    {year}
  </Typography>
);

type Props = {
  data: HistoricalRecords;
  currentSeason: number;
  userId: string;
};

export default function ChampionsRow({ data, currentSeason, userId }: Props) {
  const years = closedSeasons(data);
  const defendingYear = years[years.length - 1];
  const topScore = highestWinningScore(data);
  // Champions are listed by name only, so the "you" match goes through the
  // career list's names.
  const idByName = new Map(
    data.career.map((c) => [cleanName(c.name).toLowerCase(), c.user_id])
  );
  const halfByYear = (list: HistoricalChampion[]) =>
    new Map(list.map((c) => [c.year, c]));
  const firstHalf = halfByYear(data.first_half_champions);
  const secondHalf = halfByYear(data.second_half_champions);

  const halfLine = (label: string, champ: HistoricalChampion | undefined) =>
    champ && (
      <Typography variant="caption" color="text.secondary" component="span">
        {label}:{" "}
        <Box component="b" sx={{ color: "text.primary", fontWeight: 600 }}>
          {champ.names.map(cleanName).join(", ")}
        </Box>
        {champ.score != null && ` · ${champ.score}`}
      </Typography>
    );

  const champions = [...data.champions].sort((a, b) => b.year - a.year);

  return (
    <Box
      sx={{
        display: "flex",
        gap: 1.25,
        overflowX: "auto",
        pb: 1,
        scrollSnapType: "x proximity",
      }}
    >
      {currentSeason > defendingYear && (
        <Tile variant="live">
          <Year year={currentSeason} />
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            In progress
          </Typography>
          <Tag tone="grey">This season</Tag>
        </Tile>
      )}
      {champions.map((champ) => {
        const unknown = isUnknownChampion(champ);
        const names = champ.names.map(cleanName);
        const isYou =
          !unknown &&
          names.some((n) => String(idByName.get(n.toLowerCase())) === userId);
        const halves = champ.year >= HALVES_FROM_SEASON && (
          <Stack
            sx={{ mt: 0.75, pt: 0.75, borderTop: 1, borderColor: "divider" }}
          >
            {halfLine("1st half", firstHalf.get(champ.year))}
            {halfLine("2nd half", secondHalf.get(champ.year))}
          </Stack>
        );

        return (
          <Tile
            key={champ.year}
            variant={
              champ.year === defendingYear
                ? "defending"
                : unknown
                  ? "muted"
                  : "plain"
            }
          >
            <Year year={champ.year} />
            {unknown ? (
              <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                Champion unknown
              </Typography>
            ) : (
              <>
                <Stack
                  sx={{
                    mt: 0.5,
                    fontWeight: 600,
                    fontSize: names.length > 1 ? "0.8rem" : "0.875rem",
                    ...(isYou && {
                      bgcolor: YOU_TINT,
                      mx: -0.5,
                      px: 0.5,
                      borderRadius: 0.5,
                    }),
                  }}
                >
                  {names.map((name) => (
                    <span key={name}>{name}</span>
                  ))}
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  {champ.score} pts
                </Typography>
              </>
            )}
            <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.5 }}>
              {champ.year === defendingYear && !unknown && (
                <Tag tone="gold">Defending</Tag>
              )}
              {topScore !== undefined &&
                champ.score === topScore &&
                !unknown && <Tag tone="high">▲ Highest score</Tag>}
              {names.length > 1 && (
                <Tag tone="grey">{names.length}-way tie</Tag>
              )}
              {unknown && <Tag tone="grey">Incomplete</Tag>}
            </Stack>
            {halves}
          </Tile>
        );
      })}
    </Box>
  );
}
