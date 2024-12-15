import { RankedUser } from "../../types";

export type UserGridProps = {
  userList: RankedUser[];
  userId: string;
  showSecondHalf: boolean;
  week: number;
};
