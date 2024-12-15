import { onValue, ref } from "firebase/database";
import { db } from "../../api/firebase";
import { Game } from "../types";

export const GetGameDataByWeek = (
  week: number,
  callback: (games: Game[]) => void
) => {
  const weekFormat = week.toString().padStart(2, "0");

  if (week === 0) {
    callback([]);
    return;
  }

  const gameRef = ref(db, `weeks/week${weekFormat}/games_sorted/`);

  return onValue(gameRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback([]);
    }
  });
};
