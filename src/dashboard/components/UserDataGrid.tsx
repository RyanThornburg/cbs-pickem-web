import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
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
import { StatusColor, stringAvatar } from "../helper";

const defaultHeight = "1126px";

const FormatOnePick = (pick: Pick, index: number) => {
  if (index > 4) {
    // why cbs allows this?
    return;
  }
  console.log(pick, index);
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
    StatusColor[(pick.pick_status as keyof typeof StatusColor) ?? "TBD"];

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
      ...theme.applyStyles("dark", { backgroundColor: statusColor.bgBack }),
    },
    pick.pick_status == "CORRECT" && {
      backgroundColor: theme.palette.primary[50],
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
  {
    field: "name",
    headerName: "Name",
    minWidth: 145,
    flex: 4,
    renderCell: (params: GridRenderCellParams<any, string>) => (
      <Stack
        sx={{
          alignItems: "center",
          justifyContent: "flex-start",
        }}
        direction="row"
        spacing={2}
      >
        <Avatar
          {...stringAvatar(params.value ?? "", {
            width: 20,
            height: 20,
            fontSize: 10,
          })}
        />
        <Box sx={{ fontSize: "1rem" }}>{params.value}</Box>
      </Stack>
    ),
  },
  {
    field: "score",
    align: "center",
    headerAlign: "center",
    headerName: "Score",

    valueGetter: (value, row) => {
      return row.score + row.trending_score;
    },
  },
  {
    field: "period_score",
    align: "center",
    headerAlign: "center",
    headerName: "Week",

    valueGetter: (value, row) => {
      return row.period_score + row.trending_score;
    },
  },
  {
    field: "picks",
    minWidth: 490,
    flex: 10,
    align: "left",
    headerName: "Picks",
    renderCell: RenderPicks,
    display: "flex",
  },
];
export type Props = {
  week: number;
};
export default function UserDataGrid({ week }: Props) {
  const [users, setUsers] = useState([]);

  const weekFormat = week.toString().padStart(2, "0") ?? "01";
  const weekPath = `weeks/week${weekFormat}/users/`;

  useEffect(() => {
    if (week === 0) {
      return;
    }
    const userRef = ref(db, weekPath);
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
