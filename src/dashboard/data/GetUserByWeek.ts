import { onValue, ref } from "firebase/database";
import { db } from "../../api/firebase";
import { User, RankedUser } from "../types";

const compareUsers = (a: RankedUser, b: RankedUser): number => {
  // First compare places
  if (a.place !== b.place) {
    return a.place > b.place ? 1 : -1;
  }

  // Then compare second half places
  const aSecondHalf = a?.second_half_place ?? 0;
  const bSecondHalf = b?.second_half_place ?? 0;
  if (aSecondHalf !== bSecondHalf) {
    return aSecondHalf > bSecondHalf ? 1 : -1;
  }

  // Finally, compare names alphabetically
  return a.name.toUpperCase().localeCompare(b.name.toUpperCase());
};

const userScore = (user: User, isSecondHalf: boolean): number => {
  return (
    (isSecondHalf ? user.second_half ?? 0 : user.score) + user.trending_score
  );
};

const findUserRank = (
  sortedUsers: User[],
  isSecondHalf: boolean,
  userId: string
): number => {
  // Find the index of our user
  const userIndex = sortedUsers.findIndex((user) => user.id === userId);
  if (userIndex === -1) return 0;

  // If this is the first user, their rank is 1
  if (userIndex === 0) return 1;

  // Look at the previous user's score to determine rank
  const currentScore = userScore(sortedUsers[userIndex], isSecondHalf);
  const prevUserScore = userScore(sortedUsers[userIndex - 1], isSecondHalf);

  // If scores are equal, return the same rank as the previous user
  // If scores are different, rank is position + 1
  return currentScore === prevUserScore
    ? findUserRank(sortedUsers, isSecondHalf, sortedUsers[userIndex - 1].id)
    : userIndex + 1;
};

export const GetUserByWeek = (
  week: number,
  callback: (users: RankedUser[]) => void
) => {
  const weekFormat = week.toString().padStart(2, "0");

  if (week === 0) {
    callback([]);
    return;
  }

  const userRef = ref(db, "userPicks/");

  return onValue(userRef, (snapshot) => {
    if (snapshot.exists()) {
      // Fix the data extraction to properly get user data for the specific week
      const filteredUsers: User[] = Object.entries(snapshot.val())
        .map(([userId, weeks]: [string, any]) => ({
          id: userId,
          ...weeks[`week${weekFormat}`],
        }))
        .filter((user) => user && Object.keys(user).length > 1); // Filter out empty/invalid users

      const sortedOverall = [...filteredUsers].sort((a, b) => {
        const scoreA = userScore(a, false);
        const scoreB = userScore(b, false);
        return scoreB - scoreA; // Descending order
      });
      const sortedSecondHalf = [...filteredUsers].sort((a, b) => {
        const scoreA = userScore(a, true);
        const scoreB = userScore(b, true);
        return scoreB - scoreA; // Descending order
      });
      const userRankList: RankedUser[] = filteredUsers.map((user: User) => ({
        place: findUserRank(sortedOverall, false, user.id),
        second_half_place: findUserRank(sortedSecondHalf, true, user.id),
        ...user,
      }));
      userRankList.sort(compareUsers);
      callback(userRankList);
    } else {
      callback([]);
    }
  });
};
