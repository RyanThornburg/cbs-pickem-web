import { default as Box } from "@mui/material/Box";
import { onValue, ref } from "firebase/database";
import { useEffect, useState } from "react";
import { db } from "../../components/firebase";
import { Game } from "../../types";
import { gameDate } from "../helper";
import GameScores from "./Scoreboard/GameScores";

export type Props = {
  week: number;
};

export default function GamesMain({ week }: Props) {
  const [currentGames, setCurrentGames] = useState<Game[]>([]);
  const weekFormat = week.toString().padStart(2, "0");
  const weekPath = `weeks/week${weekFormat}/games_sorted/`;
  let currentGameTime = "";

  useEffect(() => {
    const userRef = ref(db, weekPath);
    return onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        setCurrentGames(snapshot.val());
      }
    });
  }, [weekPath]);

  const gameStarts = currentGames
    .map((item) => gameDate(item.starts_at))
    .filter((value, index, self) => self.indexOf(value) === index);

  // has to be a better way than this
  const gameArrays: Game[][] = [];
  gameStarts.forEach((startTime: string) => {
    console.log(startTime);
    const gameBlock = currentGames.filter(
      (game: Game) => gameDate(game.starts_at) === startTime
    );
    gameArrays.push(gameBlock);
  });

  gameArrays.forEach((games: Game[], index) => {
    console.log("!!!!!!!!", gameStarts[index]);
    games.map((game: Game) => console.log(game));
  });

  return (
    <Box sx={{ width: "100%", flexGrow: 1 }}>
      {gameArrays.map((games: Game[], index) => (
        <GameScores header={gameStarts[index]} games={games} />
      ))}
    </Box>
  );
}
