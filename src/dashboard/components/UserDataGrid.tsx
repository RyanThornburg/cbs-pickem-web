import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import {db} from "../../components/firebase"
import {ref, get, onValue} from "firebase/database"
import {Pick, PickStatus, GameStatus} from "../../types"
import {useEffect, useState} from 'react'
import {red, green, blue, amber} from "@mui/material/colors"
import Container from '@mui/material/Container';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import { styled } from '@mui/material/styles';
import { BorderColor } from '@mui/icons-material';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import BlindSharpIcon from '@mui/icons-material/BlindSharp';
import StarBorderOutlinedIcon from '@mui/icons-material/StarBorderOutlined';
import CheckIcon from '@mui/icons-material/Check'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney' ;



const FormatOnePick = (pick: Pick) => {
    const colorBad = red[50]
    
    const team = pick.visible ? pick.team : (
        pick.pick_status === PickStatus.Missing ? PickStatus.Missing :
        pick.game_status === GameStatus.Scheduled ? "TBD" : "???") 
    let bgColor = ''
    let fontWeight = 'regular'
    let fontStyle = 'normal'
    const inProgress = (pick.visible && pick.game_status === GameStatus.Inprogress)

    if (pick.pick_status === PickStatus.Correct) {
        bgColor = green[50]
    } 
    if (pick.pick_status === PickStatus.Incorrect 
        || pick.pick_status === PickStatus.Missing){
        bgColor = red[50]
    }

    if (pick.visible && pick.game_status === GameStatus.Inprogress) {
        fontStyle = 'italic'
    }

    if (pick.visible && pick.game_status === GameStatus.Final) {
        fontWeight = 'bold'
    }

    if (team === 'TBD'){
        bgColor = blue[50]
    }

    const Item = styled(Paper)(({ theme }) => ([
        {
            backgroundColor: bgColor,
            ...theme.typography.body2,
            padding: 1,
            width:75,
            textAlign: 'center',
            color: theme.palette.text.primary,
            fontWeight:fontWeight,
            fontStyle: fontStyle,
            ...theme.applyStyles('dark', {backgroundColor: '#1A2027',}),
        },
        inProgress && { 
            border: `dashed ${amber[500]}`
        },
    ]));

    return (
        <Box sx={{mb:0}}><Item >{team}</Item></Box>
        
        
            
    )
}
function RenderPicks(props: GridRenderCellParams<any>) {
    console.log('props', props)
    const picks: Array<Pick> = props.value;
    return (
        
            <Stack sx={{
                justifyContent: "center",
                alignItems: "center",
                mt:0,
                mb:0,
                display:'inline-flex'
              }} direction="row" spacing={1} divider={<Divider orientation="vertical" flexItem />}>
            {picks.map(FormatOnePick)}
            </Stack>
     
    )
}
function RenderScore(props: GridRenderCellParams<any>) {
    const {period_score, trending_score} = props.row
    const score = period_score + trending_score;
    let icons;
    let color;
    if (score === 0) {
        icons = [<BlindSharpIcon></BlindSharpIcon>]
    }
    if (score === 1) {
        icons = [<CheckIcon></CheckIcon>]
    }
    if (score === 2) {
        icons = new Array(score).fill(<CheckIcon></CheckIcon>)
    }
    if (score === 3) {
        icons = new Array(score).fill(<StarBorderOutlinedIcon></StarBorderOutlinedIcon>)
    }
    if (score === 4){
        icons = new Array(score).fill(<WhatshotIcon></WhatshotIcon>)
    }
    if (score === 5){
        icons = new Array(score).fill(<AttachMoneyIcon></AttachMoneyIcon>)
    }

    console.log('render', icons)
    return (<Box>
        {score}
        <Stack direction="row" spacing={0.5}>
            {icons?.map((value) => (
          <Box>value</Box>
        ))}
        </Stack>
    </Box>)
}
const columns: GridColDef[] = [
    {field: 'user', headerName: 'Name', flex:1 },
    {field: 'score', align: 'center', headerAlign: 'center', headerName: 'Score', minWidth: 75, flex: 0.5, valueGetter: (value, row) => {return row.score + row.trending_score}},
    {field: 'period_score', align: 'center', headerAlign: 'center', headerName: 'Week', minWidth: 75, flex: 0.5, valueGetter: (value, row) => {return row.period_score + row.trending_score}},
    {field: 'picks', headerName: 'Picks',flex:2, renderCell: RenderPicks }
]


export default function UserDataGrid() {
    const [users, setUsers] = useState([]);

    useEffect(()=>{
        const userRef = ref(db, 'users/')
        return onValue(userRef, (snapshot) => {
            if (snapshot.exists()) {
                setUsers(snapshot.val())
            }
        })
    }, [])

    console.log(users)

    return (
      <DataGrid
      density='compact'
        rows={users}
        columns={columns}
      />
    );
  }