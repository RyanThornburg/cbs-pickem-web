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
import { GameStatus, Pick, PickStatus, User } from "../../types";

//import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
//import BlindSharpIcon from "@mui/icons-material/BlindSharp";
//import CheckIcon from "@mui/icons-material/Check";
//import StarBorderOutlinedIcon from "@mui/icons-material/StarBorderOutlined";
//import WhatshotIcon from "@mui/icons-material/Whatshot";
import { StatusColor, stringAvatar } from "../helper";

const defaultHeight = "1044px";

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
    pick.pick_status === "CORRECT" && {
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
    <Box key={index}>
      <Item>{team}</Item>
    </Box>
  );
};
function RenderPicks(props: GridRenderCellParams<any>) {
  const picks: Array<Pick> = props.value;

  return (
    <Stack
      key={`stack-${props.id}`}
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

const columns: GridColDef[] = [
  {
    field: "name",
    headerName: "Name",
    description: "Name",
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
    flex: 2,
    valueGetter: (value, row) => {
      return row.score + row.trending_score;
    },
  },
  {
    field: "second_half",
    align: "center",
    headerAlign: "center",
    headerName: "2nd Half",
    flex: 2,
    valueGetter: (value, row) => {
      return row.second_half + row.trending_score;
    },
  },
  {
    field: "period_score",
    align: "center",
    headerAlign: "center",
    headerName: "Week",
    flex: 1.5,
    valueGetter: (value, row) => {
      return row.period_score + row.trending_score;
    },
  },
  {
    field: "picks",
    flex: 10,
    align: "left",
    headerName: "Picks",
    renderCell: RenderPicks,
    display: "flex",
  },
];
export type Props = {
  week: number;
  userId: string;
};
export default function UserDataGrid({ week, userId }: Props) {
  const [users, setUsers] = useState<User[]>([]);
  const weekFormat = week.toString().padStart(2, "0") ?? "08";
  const weekPath = "userPicks/";

  useEffect(() => {
    if (week === 0) {
      return;
    }
    const userRef = ref(db, weekPath);
    return onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const filteredUsers: User[] = Object.entries(snapshot.val()).map(
          ([key, weeks]: [string, any]) => weeks[`week${weekFormat}`]
        );
        setUsers(filteredUsers);
      }
    });
  }, [week, weekFormat]);

  return (
    <DataGrid
      density="compact"
      loading={users.length === 0}
      getRowId={(row) => row.id}
      rows={users}
      columns={columns}
      disableColumnSelector
      columnVisibilityModel={{
        second_half: week >= 10,
      }}
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
      getRowClassName={(params) => {
        return params.row.id === userId ? "highlight" : "";
      }}
      sx={{
        "--DataGrid-overlayHeight": { defaultHeight },
        ".highlight": {
          bgcolor: (theme) =>
            theme.palette.mode === "dark" ? "#78909c" : "#f0f4c3",
        },
      }}
    />
  );
}
