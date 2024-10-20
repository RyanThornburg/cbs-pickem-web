import Box from "@mui/material/Box";
import { blue, green, orange, red } from "@mui/material/colors";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import { styled } from "@mui/material/styles";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { onValue, ref } from "firebase/database";
import { useEffect, useState } from "react";
import { db } from "../../components/firebase";
import { GameStatus, Pick, PickStatus } from "../../types";

import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import BlindSharpIcon from "@mui/icons-material/BlindSharp";
import CheckIcon from "@mui/icons-material/Check";
import StarBorderOutlinedIcon from "@mui/icons-material/StarBorderOutlined";
import WhatshotIcon from "@mui/icons-material/Whatshot";

const defaultHeight = "1126px";

const pickColor = {
  CORRECT: {
    bgColor: green[50],
    borderColor: green[400],
    borderInProgressColor: green["A400"],
  },
  INCORRECT: {
    bgColor: red[100],
    borderColor: red[400],
    borderInProgressColor: red["A400"],
  },
  MISSING: {
    bgColor: orange[100],
    borderColor: orange[400],
    borderInProgressColor: orange["A400"],
  },
  TBD: {
    bgColor: blue[50],
    borderColor: blue[400],
    borderInProgressColor: blue["A400"],
  },
  NONE: {
    bgColor: blue[50],
    borderColor: blue[400],
    borderInProgressColor: blue["A400"],
  },
};

const FormatOnePick = (pick: Pick, index: number) => {
  if (index > 4) {
    // why cbs allows this?
    return;
  }
  const team = pick.visible
    ? pick.team
    : pick.pick_status === PickStatus.Missing
    ? PickStatus.Missing
    : pick.game_status === GameStatus.Scheduled
    ? "TBD"
    : "???";

  let fontWeight = "regular";
  let fontStyle = "normal";

  const isGameOver = pick.visible && pick.game_status === GameStatus.Final;
  const inProgress = pick.visible && pick.game_status === GameStatus.Inprogress;

  const statusColor =
    pickColor[(pick.pick_status as keyof typeof pickColor) ?? "TBD"];

  const Item = styled(Paper)(({ theme }) => [
    {
      backgroundColor: statusColor.bgColor,
      ...theme.typography.body2,
      padding: 1,
      width: 70,
      textAlign: "center",
      color: theme.palette.text.primary,
      fontWeight: fontWeight,
      fontStyle: fontStyle,
      ...theme.applyStyles("dark", { backgroundColor: "#1A2027" }),
    },
    isGameOver && {
      border: `thin solid ${statusColor.borderColor}`,
    },
    inProgress && {
      border: `dashed ${statusColor.borderInProgressColor}`,
      fontStyle: "italic",
    },
  ]);

  return (
    <Box>
      <Item>{team}</Item>
    </Box>
  );
};
function RenderPicks(props: GridRenderCellParams<any>) {
  const picks: Array<Pick> = props.value;
  return (
    <Stack
      sx={{
        justifyContent: "flex-start",
        alignItems: "center",
      }}
      direction="row"
      spacing={1}
      divider={<Divider orientation="vertical" flexItem />}
    >
      {picks && picks.map(FormatOnePick)}
    </Stack>
  );
}

function RenderScore(props: GridRenderCellParams<any>) {
  const { period_score, trending_score } = props.row;
  const score = period_score + trending_score;
  let icons;
  let color;
  if (score === 0) {
    icons = [<BlindSharpIcon></BlindSharpIcon>];
  }
  if (score === 1) {
    icons = [<CheckIcon></CheckIcon>];
  }
  if (score === 2) {
    icons = new Array(score).fill(<CheckIcon></CheckIcon>);
  }
  if (score === 3) {
    icons = new Array(score).fill(
      <StarBorderOutlinedIcon></StarBorderOutlinedIcon>
    );
  }
  if (score === 4) {
    icons = new Array(score).fill(<WhatshotIcon></WhatshotIcon>);
  }
  if (score === 5) {
    icons = new Array(score).fill(<AttachMoneyIcon></AttachMoneyIcon>);
  }

  return (
    <Box>
      {score}
      <Stack direction="row" spacing={0.5}>
        {icons?.map((value) => (
          <Box>value</Box>
        ))}
      </Stack>
    </Box>
  );
}
const columns: GridColDef[] = [
  { field: "name", headerName: "Name", minWidth: 145 },
  {
    field: "score",
    align: "center",
    headerAlign: "center",
    headerName: "Score",
    minWidth: 75,
    valueGetter: (value, row) => {
      return row.score + row.trending_score;
    },
  },
  {
    field: "period_score",
    align: "center",
    headerAlign: "center",
    headerName: "Week",
    minWidth: 60,
    valueGetter: (value, row) => {
      return row.period_score + row.trending_score;
    },
  },
  {
    field: "picks",
    minWidth: 490,
    align: "left",
    headerName: "Picks",
    renderCell: RenderPicks,
    display: "flex",
  },
];

export default function UserDataGrid() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const userRef = ref(db, "users/");
    return onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        setUsers(snapshot.val());
      }
    });
  }, []);

  return (
    <DataGrid
      density="compact"
      loading={users.length === 0}
      getRowId={(row) => row.id}
      rows={users}
      columns={columns}
      hideFooter={true}
      slotProps={{
        loadingOverlay: {
          variant: "linear-progress",
          noRowsVariant: "skeleton",
        },
      }}
      initialState={{
        sorting: {
          sortModel: [{ field: "score", sort: "desc" }],
        },
      }}
      sx={{
        "--DataGrid-overlayHeight": { defaultHeight },
      }}
    />
  );
}
