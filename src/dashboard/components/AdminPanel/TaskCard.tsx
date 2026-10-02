import {
  Card,
  CardContent,
  Chip,
  Link,
  Stack,
  Typography,
} from "@mui/material";
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
  // The heartbeat is stale (or the page can't reach meta:admin), so this
  // card's health is out of date too: grey it out as "Unknown" rather than
  // keep showing a green "Fresh".
  dimmed?: boolean;
  // Anchor id, so the banner can link to a problem card.
  id?: string;
  // The newest active system event from this task's source, if any.
  event?: string;
  // Where that event's row is, e.g. "#admin-events".
  eventsHref?: string;
};

export default function TaskCard({
  name,
  health,
  runs,
  now,
  note,
  detail,
  dimmed = false,
  id,
  event,
  eventsHref,
}: Props) {
  // A problem card gets a colored edge so it stands out in a grid of healthy
  // ones; the chip alone was easy to miss.
  const severity = dimmed ? null : healthSeverity(health);
  return (
    <Card
      variant="outlined"
      id={id}
      sx={{
        height: "100%",
        scrollMarginTop: 96,
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
            label={dimmed ? "Unknown" : HEALTH_LABEL[health]}
            color={dimmed ? "default" : HEALTH_COLOR[health]}
            variant={
              health === "idle" || health === "ok" || dimmed
                ? "outlined"
                : "filled"
            }
          />
        </Stack>
        {note && (
          <Chip size="small" variant="outlined" label={note} sx={{ mb: 1 }} />
        )}
        <Stack spacing={0.5}>
          {runs.map((run) => {
            // Attempted more recently than it succeeded: lead with how long
            // it's been since it worked, then the failed try.
            const failing = isFailing(run.lastAt, run.lastSuccessAt);
            return (
              <div key={run.label ?? "run"}>
                {/* Wraps to two lines in a narrow card, one line on a phone. */}
                <Stack
                  direction="row"
                  useFlexGap
                  sx={{
                    flexWrap: "wrap",
                    alignItems: "baseline",
                    columnGap: 1,
                  }}
                >
                  <Typography variant="body2">
                    {run.label && (
                      <Typography
                        component="span"
                        variant="body2"
                        sx={{ color: "text.secondary" }}
                      >
                        {run.label}:{" "}
                      </Typography>
                    )}
                    {failing ? "last success" : "ok"}{" "}
                    {formatAgo(run.lastSuccessAt, now)}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary" }}
                  >
                    {formatEt(run.lastSuccessAt)}
                  </Typography>
                </Stack>
                {failing && (
                  <Typography
                    variant="caption"
                    sx={{ color: "error.dark", display: "block" }}
                  >
                    last try {formatAgo(run.lastAt, now)}, failed
                  </Typography>
                )}
              </div>
            );
          })}
          {detail}
          {event && (
            <Typography
              variant="caption"
              sx={{
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                fontFamily: "monospace",
                wordBreak: "break-word",
                color: "text.secondary",
              }}
            >
              {event}
            </Typography>
          )}
          {event && eventsHref && (
            <Link href={eventsHref} variant="caption">
              See System events
            </Link>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
