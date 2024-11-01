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
  users: User[];
};

export default function UserSelectDropdown() {
  const [users, setUsers] = useState([]);
  const [userSelect, setUserSelect] = useState("");

  useEffect(() => {
    const userRef = ref(db, "users/");
    return onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const listUsers = snapshot
          .val()
          .sort((a: User, b: User) =>
            a?.name < b?.name ? -1 : a?.name > b.name ? 1 : 0
          );
        setUsers(listUsers);
      }
    });
  }, []);

  const handleChange = (event: SelectChangeEvent) => {
    setUserSelect(event.target.value);
  };

  return (
    <Box sx={{ minWidth: 150 }}>
      <FormControl variant="standard" sx={{ minWidth: 150 }}>
        <InputLabel id="userListLabel">User</InputLabel>
        <Select
          sx={{ pl: "12px" }}
          labelId="userList"
          id="user-drop-down"
          value={userSelect}
          onChange={handleChange}
          label="User Details"
        >
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          {users.map((user: User) => {
            return <MenuItem value={user.id}>{user.name}</MenuItem>;
          })}
        </Select>
      </FormControl>
    </Box>
  );
}
