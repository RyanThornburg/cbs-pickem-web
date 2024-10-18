import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import { Game } from '../../types';
export type Props = {
    header: string;
    games: Game[];
};

export default function GameScores({header, games}: Props) {

    return <Box>
        {header}
        {games.map((game) => (
           <Grid sx={{border:1}} size={{ xs: 12, sm: 12, lg: 6 }}><Box>{game.game_str}</Box></Grid>
        ))}
        </Box>
}