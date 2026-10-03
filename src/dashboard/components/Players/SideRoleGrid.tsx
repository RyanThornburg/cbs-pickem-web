import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { SideRoleRecord } from "../../types";
import { Tone, recordTone } from "./playerUtils";

const TONE_SX: Record<Tone, object> = {
  good: { bgcolor: "#eef7ef", borderColor: "#a5d6a7" },
  bad: { bgcolor: "#fcefef", borderColor: "#ef9a9a" },
  neutral: {},
};

// Home or road crossed with favorite or underdog, so "4-1 on road dogs"
// stands out. The tint repeats what the record says; it's never the only
// signal.
export function SideRoleGrid({ sideRoles }: { sideRoles: SideRoleRecord[] }) {
  const cell = (side: "home" | "away", role: "favorite" | "underdog") => {
    const record = sideRoles.find((r) => r.side === side && r.role === role);
    const graded = record ? record.wins + record.losses : 0;
    const label = `${side === "home" ? "Home" : "Road"} ${role === "favorite" ? "favorites" : "underdogs"}`;
    return (
      <Box
        role="group"
        aria-label={label}
        sx={[
          {
            border: 1,
            borderColor: "hsl(220, 20%, 88%)",
            borderRadius: 2,
            p: 1.25,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 0.25,
            minWidth: 0,
          },
          graded === 0 && { bgcolor: "hsl(220, 35%, 97%)" },
          TONE_SX[recordTone(record)],
        ]}
      >
        <Typography
          sx={{
            fontSize: "1.125rem",
            fontWeight: 700,
            fontVariantNumeric: "tabular-nums",
            color: graded === 0 ? "text.disabled" : "text.primary",
          }}
        >
          {record ? `${record.wins}-${record.losses}` : "0-0"}
        </Typography>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          {graded === 0
            ? "none yet"
            : `${Math.round((record!.wins / graded) * 100)}% · ${record!.picks} ${record!.picks === 1 ? "pick" : "picks"}`}
        </Typography>
      </Box>
    );
  };
  const head = (text: string) => (
    <Typography
      variant="caption"
      sx={{ color: "text.secondary", fontWeight: 500, textAlign: "center" }}
    >
      {text}
    </Typography>
  );
  const rowHead = (text: string) => (
    <Typography
      variant="caption"
      sx={{
        color: "text.secondary",
        fontWeight: 500,
        alignSelf: "center",
      }}
    >
      {text}
    </Typography>
  );
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "48px minmax(0, 1fr) minmax(0, 1fr)",
        gap: 0.75,
        maxWidth: 440,
      }}
    >
      <span />
      {head("Favorite")}
      {head("Underdog")}
      {rowHead("Home")}
      {cell("home", "favorite")}
      {cell("home", "underdog")}
      {rowHead("Road")}
      {cell("away", "favorite")}
      {cell("away", "underdog")}
    </Box>
  );
}
