import { Box, Stack, Typography } from "@mui/material";
import { HistoricalChampion, HistoricalRecords } from "../../types";
import {
  cleanName,
  closedSeasons,
  highestWinningScore,
  isUnknownChampion,
  seasonPeriods,
} from "./recordsUtils";
import { GOLD, INCOMPLETE_HATCH, YOU_FILL } from "./recordsTheme";

type TagTone = "gold" | "grey";

const TAG_COLORS: Record<TagTone, { bg: string; fg: string }> = {
  gold: { bg: GOLD, fg: "#3d2c05" },
  grey: { bg: "hsl(220, 30%, 94%)", fg: "rgba(0, 0, 0, 0.7)" },
};

function Tag({ tone, children }: { tone: TagTone; children: React.ReactNode }) {
  const { bg, fg } = TAG_COLORS[tone];
  return (
    <Box
      component="span"
      sx={{
        alignSelf: "flex-start",
        fontSize: "0.75rem",
        fontWeight: 600,
        lineHeight: 1.5,
        borderRadius: "4px",
        px: 0.75,
        bgcolor: bg,
        color: fg,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </Box>
  );
}

const You = () => (
  <Box component="span" sx={{ fontWeight: 700 }}>
    {" "}
    (you)
  </Box>
);

type Props = {
  data: HistoricalRecords;
  currentSeason: number;
  userId: string;
};

// Every champion at once, newest first: a grid of tiles from sm up, a
// plain list on phones. No scroller, so the repeat winners and the unknown
// 2015/2016 seasons read as one history.
export default function ChampionsWall({ data, currentSeason, userId }: Props) {
  const years = closedSeasons(data);
  const defendingYear = years[years.length - 1];
  const topScore = highestWinningScore(data);
  // Champions are listed by name only, so the "you" match goes through the
  // career list's names.
  const idByName = new Map(
    data.career.map((c) => [cleanName(c.name).toLowerCase(), c.user_id])
  );
  const isYouName = (name: string) =>
    String(idByName.get(name.toLowerCase())) === userId;
  const champions = [...data.champions].sort((a, b) => b.year - a.year);

  // One line per period inside the season (the halves so far), in the
  // season's order.
  const periodLines = (year: number) => {
    const lines = seasonPeriods(data, year).map((period) => ({
      ...period,
      champ: data.period_champions?.find(
        (c) => c.year === year && c.period_key === period.key
      ),
    }));
    if (!lines.some((line) => line.champ)) return null;
    // Scores only when every period has one, so the lines match.
    const withScores = lines.every((line) => line.champ?.score != null);
    return (
      <Stack sx={{ mt: 0.5, pt: 0.5, borderTop: 1, borderColor: "divider" }}>
        {lines.map(
          ({ key, name, champ }) =>
            champ && (
              <Typography
                key={key}
                variant="caption"
                sx={{ color: "text.secondary" }}
              >
                {name}:{" "}
                <Box
                  component="b"
                  sx={{ color: "text.primary", fontWeight: 600 }}
                >
                  {champ.names.map(cleanName).join(", ")}
                </Box>
                {withScores && ` · ${champ.score}`}
              </Typography>
            )
        )}
      </Stack>
    );
  };

  const tags = (champ: HistoricalChampion, unknown: boolean) => (
    <>
      {champ.year === defendingYear && !unknown && (
        <Tag tone="gold">Defending</Tag>
      )}
      {topScore !== undefined && champ.score === topScore && !unknown && (
        <Tag tone="grey">Highest winning score</Tag>
      )}
      {champ.names.length > 1 && (
        <Tag tone="grey">{champ.names.length}-way tie</Tag>
      )}
      {unknown && <Tag tone="grey">Incomplete records</Tag>}
    </>
  );

  return (
    <Stack spacing={1.5}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        <Typography component="h3" variant="h6">
          Champions
        </Typography>
        {currentSeason > defendingYear && (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {currentSeason} season in progress
          </Typography>
        )}
      </Box>
      <Box
        component="ol"
        aria-label="Champions by season, newest first"
        sx={{
          listStyle: "none",
          m: 0,
          p: 0,
          display: "grid",
          gap: { xs: 0, sm: 1 },
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(auto-fill, minmax(150px, 1fr))",
          },
          // Phones: one bordered list instead of tiles.
          border: { xs: 1, sm: 0 },
          borderColor: { xs: "divider" },
          borderRadius: { xs: 2, sm: 0 },
          overflow: { xs: "hidden", sm: "visible" },
        }}
      >
        {champions.map((champ) => {
          const unknown = isUnknownChampion(champ);
          const names = champ.names.map(cleanName);
          const isYou = !unknown && names.some(isYouName);
          const defending = champ.year === defendingYear && !unknown;
          return (
            <Box
              component="li"
              key={champ.year}
              sx={(t) => ({
                display: "flex",
                flexDirection: "column",
                gap: 0.25,
                p: { xs: "8px 12px", sm: 1.25 },
                // tiles from sm, rows of a list on phones
                [t.breakpoints.up("sm")]: {
                  border: 1,
                  borderColor: defending ? GOLD : "divider",
                  borderRadius: 2,
                },
                [t.breakpoints.down("sm")]: {
                  borderTop: 1,
                  borderColor: "divider",
                  "&:first-of-type": { borderTop: 0 },
                  display: "grid",
                  gridTemplateColumns: "44px minmax(0, 1fr) auto",
                  columnGap: 1,
                  alignItems: "baseline",
                },
                ...(unknown && { backgroundImage: INCOMPLETE_HATCH }),
                ...(isYou && {
                  bgcolor: YOU_FILL,
                  boxShadow: `inset 3px 0 0 ${t.palette.primary.main}`,
                }),
              })}
            >
              <Typography
                sx={{
                  fontSize: { xs: "0.875rem", sm: "1.125rem" },
                  fontWeight: 700,
                  lineHeight: 1.3,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {champ.year}
              </Typography>
              <Box sx={{ minWidth: 0 }}>
                {unknown ? (
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Champion unknown
                  </Typography>
                ) : (
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 600, fontSize: "0.8125rem" }}
                  >
                    {names.map((name, i) => (
                      <Box
                        component="span"
                        key={name}
                        sx={{ display: { sm: "block" } }}
                      >
                        {name}
                        {isYouName(name) && <You />}
                        {i < names.length - 1 && (
                          <Box
                            component="span"
                            sx={{ display: { sm: "none" } }}
                          >
                            ,{" "}
                          </Box>
                        )}
                      </Box>
                    ))}
                  </Typography>
                )}
                {!unknown && champ.score != null && (
                  <Typography
                    variant="caption"
                    component="div"
                    sx={{
                      color: "text.secondary",
                      display: { xs: "none", sm: "block" },
                    }}
                  >
                    {champ.score} pts
                  </Typography>
                )}
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 0.5,
                    mt: { xs: 0.25, sm: 0.5 },
                    "&:empty": { display: "none" },
                  }}
                >
                  {tags(champ, unknown)}
                </Box>
                <Box sx={{ display: { xs: "none", sm: "block" } }}>
                  {periodLines(champ.year)}
                </Box>
              </Box>
              {!unknown && champ.score != null && (
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    fontVariantNumeric: "tabular-nums",
                    display: { sm: "none" },
                  }}
                >
                  {champ.score}
                </Typography>
              )}
            </Box>
          );
        })}
      </Box>
    </Stack>
  );
}
