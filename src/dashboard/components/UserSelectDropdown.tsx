import { MenuItem } from "@mui/material";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import { onValue, ref } from "firebase/database";
import { useEffect, useState } from "react";
import { db } from "../../components/firebase";
import { User } from "../../types";

export type Props = {
  week: number;
  user: string | undefined;
  onUserChange: any;
};

export default function UserSelectDropdown({
  week,
  user,
  onUserChange,
}: Props) {
  const [users, setUsers] = useState<User[]>([]);
  const weekFormat = week.toString().padStart(2, "0") ?? "01";

  useEffect(() => {
    const userRef = ref(db, "userPicks/");
    return onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const filteredUsers: User[] = Object.entries(snapshot.val())
          .map(([key, weeks]: [string, any]) => weeks[`week${weekFormat}`])
          .sort((a: User, b: User) =>
            a?.name < b?.name ? -1 : a?.name > b.name ? 1 : 0
          );
        setUsers(filteredUsers);
      }
    });
  }, [weekFormat]);

  const handleChange = (event: SelectChangeEvent) => {
    onUserChange(event.target.value);
  };

  return (
    <Box sx={{ minWidth: 150 }}>
      <FormControl variant="standard" sx={{ minWidth: 150 }}>
        <InputLabel id="userListLabel">User</InputLabel>
        <Select
          sx={{ pl: "12px" }}
          labelId="userList"
          id="user-drop-down"
          value={users ? user : ""}
          onChange={handleChange}
          label="User Details"
        >
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          {users.map((userItem: User) => {
            return (
              <MenuItem
                key={userItem.id}
                value={userItem.id}
                selected={user === userItem.id}
              >
                {userItem.name}
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>
    </Box>
  );
}
