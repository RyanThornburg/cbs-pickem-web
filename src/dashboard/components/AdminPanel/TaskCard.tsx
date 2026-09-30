import { Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import { ReactNode } from "react";
import {
  formatAgo,
  formatEt,
  HEALTH_COLOR,
  HEALTH_LABEL,
  healthSeverity,
  isFailing,
  TaskHealth,
} from "./adminUtils";

export type TaskRun = {
  label?: string;
  lastAt: string | null;
  lastSuccessAt: string | null;
};

export type Props = {
  name: string;
  health: TaskHealth;
  runs: TaskRun[];
  now: number;
  // Neutral note chip under the name, e.g. "Pauses during games".
  note?: string;
  // Freeform body for a task that doesn't fit the attempt/success shape.
  detail?: ReactNode;
  // The heartbeat is stale, so this card's health is out of date too: grey it
  // out rather than keep showing a green "Fresh".
  dimmed?: boolean;
};

export default function TaskCard({
  name,
  health,
  runs,
  now,
  note,
  detail,
  dimmed = false,
}: Props) {
  // A problem card gets a colored edge so it stands out in a grid of healthy
  // ones; the chip alone was easy to miss.
  const severity = dimmed ? null : healthSeverity(health);
  return (
    <Card
      variant="outlined"
      sx={{
        height: "100%",
        // The theme pads the Card itself (CardContent has none); a little
        // less on phones.
        p: { xs: 1.5, sm: 2 },
        opacity: dimmed ? 0.55 : 1,
        ...(severity && {
          borderColor: `${severity}.main`,
          borderLeftWidth: 4,
        }),
      }}
    >
      <CardContent>
        <Stack
          direction="row"
          useFlexGap
          sx={{
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            columnGap: 1,
            rowGap: 0.5,
            mb: 1,
          }}
        >
          <Typography variant="subtitle2">{name}</Typography>
          <Chip
            size="small"
            label={HEALTH_LABEL[health]}
            color={dimmed ? "default" : HEALTH_COLOR[health]}
            variant={health === "idle" || dimmed ? "outlined" : "filled"}
          />
        </Stack>
        {note && (
          <Chip
            size="small"
            variant="outlined"
            color="info"
            label={note}
            sx={{ mb: 1 }}
          />
        )}
        <Stack spacing={0.5}>
          {runs.map((run) => (
            <div key={run.label ?? "run"}>
              {/* Wraps to two lines in a narrow card, one line on a phone. */}
              <Stack
                direction="row"
                useFlexGap
                sx={{ flexWrap: "wrap", alignItems: "baseline", columnGap: 1 }}
              >
                <Typography variant="body2">
                  {run.label && (
                    <Typography
                      component="span"
                      variant="body2"
                      sx={{
                        color: "text.secondary",
                      }}
                    >
                      {run.label}:{" "}
                    </Typography>
                  )}
                  ok {formatAgo(run.lastSuccessAt, now)}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                  }}
                >
                  {formatEt(run.lastSuccessAt)}
                </Typography>
              </Stack>
              {/* Attempted more recently than it succeeded -- the matching
                  system_events row (same source) should say why. */}
              {isFailing(run.lastAt, run.lastSuccessAt) && (
                <Typography
                  variant="caption"
                  sx={{
                    color: "error.main",
                    display: "block",
                  }}
                >
                  last attempt {formatAgo(run.lastAt, now)}
                </Typography>
              )}
            </div>
          ))}
          {detail}
        </Stack>
      </CardContent>
    </Card>
  );
}
