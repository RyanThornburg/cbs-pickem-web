import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { RankedUser } from "../../types";
import { useCurrentWeek } from "../CurrentWeekContext";
import { UserAvatar } from "../UserAvatar";
import { selectedRowSx } from "../UsersTable/selectedRowSx";
import { LeaderBoard, LeaderList, LeaderRow, leaderList } from "./leadersUtils";
import { MEDAL } from "./medals";

type Props = {
  userList: RankedUser[];
  userId?: string;
  week: number;
};

const Row = ({ row, selected }: { row: LeaderRow; selected: boolean }) => {
  const medal = MEDAL[row.place];
  return (
    <Box
      sx={[
        {
          display: "grid",
          // Wide enough for a "T12" pill.
          gridTemplateColumns: "32px minmax(0, 1fr) auto",
          gap: 1,
          alignItems: "center",
          px: 0.5,
          py: 0.4,
          borderRadius: 1,
          fontVariantNumeric: "tabular-nums",
        },
        selected ? selectedRowSx : {},
      ]}
    >
      <Box
        sx={{
          // A disc for "1" or "12", a pill for "T12": the label holds the
          // 12px floor instead of shrinking to fit a fixed circle.
          minWidth: 24,
          height: 24,
          px: 0.5,
          boxSizing: "border-box",
          justifySelf: "start",
          borderRadius: 12,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "0.75rem",
          fontWeight: 800,
          bgcolor: medal?.bg ?? "action.hover",
          color: medal?.fg ?? "text.secondary",
        }}
      >
        {row.placeLabel}
      </Box>
      <Box sx={{ minWidth: 0, fontWeight: selected ? 700 : 400 }}>
        <UserAvatar
          userId={row.id}
          userName={row.name}
          size={20}
          fontSize="0.8125rem"
        />
      </Box>
      <Typography
        component="span"
        sx={{ fontWeight: 700, fontSize: "0.875rem", textAlign: "right" }}
      >
        {row.score}
        {row.covering > 0 && (
          <Box
            component="span"
            title={`${row.covering} pick${row.covering === 1 ? "" : "s"} covering now`}
            sx={{
              ml: 0.5,
              fontWeight: 500,
              fontSize: "0.72rem",
              color: "success.main",
            }}
          >
            +{row.covering}
          </Box>
        )}
      </Typography>
    </Box>
  );
};

const Rows = ({ list, userId }: { list: LeaderList; userId?: string }) => (
  <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
    {list.rows.map((row) => (
      <Row key={row.id} row={row} selected={row.id === userId} />
    ))}
    {list.youRow && (
      <>
        <Typography
          sx={{
            textAlign: "center",
            color: "text.disabled",
            fontSize: "0.8rem",
            lineHeight: 1,
          }}
        >
          ···
        </Typography>
        <Row row={list.youRow} selected />
      </>
    )}
    <Typography variant="caption" sx={{ color: "text.secondary", mt: 0.5 }}>
      <Box component="span" sx={{ color: "success.main", fontWeight: 600 }}>
        Green
      </Box>{" "}
      = picks covering right now
    </Typography>
  </Box>
);

const CardHead = ({ title, sub }: { title: string; sub: string }) => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
      gap: 1,
      mb: 0.75,
    }}
  >
    <Typography sx={{ fontWeight: 700, fontSize: "0.9rem" }}>
      {title}
    </Typography>
    <Typography variant="caption" sx={{ color: "text.secondary" }}>
      {sub}
    </Typography>
  </Box>
);

// Overall and 2nd-half paid places, at the top of User Picks from the
// second-half start week. Two cards side by side; one card with tabs on
// phones.
export default function SecondHalfLeaders({ userList, userId, week }: Props) {
  const { paidPlaces, secondHalfStartWeek } = useCurrentWeek();
  const [tab, setTab] = useState<LeaderBoard>("overall");
  if (!userList.length) return null;

  const boards: {
    key: LeaderBoard;
    title: string;
    sub: string;
    list: LeaderList;
  }[] = [
    {
      key: "overall",
      title: "Overall",
      sub: `Week ${week} · top ${paidPlaces.overall} paid`,
      list: leaderList(userList, "overall", paidPlaces.overall, userId),
    },
    {
      key: "second_half",
      title: "2nd half",
      sub: `Since week ${secondHalfStartWeek} · top ${paidPlaces.second_half} paid`,
      list: leaderList(userList, "second_half", paidPlaces.second_half, userId),
    },
  ];
  const active = boards.find((b) => b.key === tab) ?? boards[0];

  return (
    <Box sx={{ mb: 1.5, textAlign: "left" }}>
      <Box
        sx={{
          display: { xs: "none", sm: "grid" },
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 1.5,
        }}
      >
        {boards.map((b) => (
          <Paper key={b.key} variant="outlined" sx={{ px: 1.75, py: 1.5 }}>
            <CardHead title={b.title} sub={b.sub} />
            <Rows list={b.list} userId={userId} />
          </Paper>
        ))}
      </Box>

      <Paper
        variant="outlined"
        sx={{ display: { xs: "block", sm: "none" }, px: 1.5, pb: 1.5 }}
      >
        <Tabs
          value={tab}
          onChange={(_, v: LeaderBoard) => setTab(v)}
          sx={{ minHeight: 40, mb: 1, "& .MuiTab-root": { minHeight: 40 } }}
        >
          {boards.map((b) => (
            <Tab key={b.key} value={b.key} label={b.title} />
          ))}
        </Tabs>
        <Typography
          variant="caption"
          sx={{ display: "block", color: "text.secondary", mb: 0.75 }}
        >
          {active.sub}
        </Typography>
        <Rows list={active.list} userId={userId} />
      </Paper>
    </Box>
  );
}
