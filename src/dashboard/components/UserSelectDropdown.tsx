import { MenuItem } from "@mui/material";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import { RankedUser } from "../types";
import { ordinal, visuallyHidden } from "../helper";
import UserAvatar from "./UserAvatar";
import { ScoreWithCovering } from "./UsersTable/ScoreWithCovering";
import { MoneyLines } from "./UsersTable/MoneyLines";
import { ShownMoneyStanding } from "./UsersTable/usersTableUtils";

export type Props = {
  userList: RankedUser[];
  user: string | undefined;
  onUserChange: (userId: string) => void;
  // Controlled from MainGrid so the "Choose your name" hint can open it.
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // After the menu has finished closing (focus is back on the select).
  onMenuClosed?: () => void;
  // "card" on desktop: name, place and score with the money lines beside
  // them. "compact" on phones: one row, place and score after the name.
  summary: "card" | "compact";
  // The money lines worth showing (desktop card only; phones put them on
  // the table's paid lines).
  standings: ShownMoneyStanding[];
  // Set while a past week is browsed, so the card's place and money read
  // as that week's, not today's.
  asOfWeek?: number;
};

// The player picker doubles as the selected player's summary, so the
// header says who you are and where you stand in one place instead of a
// dropdown plus a second line repeating the name.
export default function UserSelectDropdown({
  userList,
  user,
  onUserChange,
  open,
  onOpenChange,
  onMenuClosed,
  summary,
  standings,
  asOfWeek,
}: Props) {
  // Case-insensitive, so lowercase names sit with their letter instead of
  // after "Z".
  const users = [...userList].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  );

  const handleChange = (event: SelectChangeEvent) => {
    onUserChange(event.target.value);
  };

  const renderValue = (value: string) => {
    const selected = users.find((u) => u.id === value);
    if (!value || !selected) {
      return (
        <Box component="span" sx={{ color: "text.secondary" }}>
          Find yourself…
        </Box>
      );
    }
    const score = (
      <ScoreWithCovering
        total={selected.cumulative_score + selected.trending_score}
        covering={selected.trending_score}
      />
    );
    const avatar = (
      <UserAvatar
        userName={selected.name}
        userId={selected.id}
        size={summary === "card" ? 32 : 22}
        includeName={false}
      />
    );

    if (summary === "compact") {
      return (
        <Box
          component="span"
          sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}
        >
          {avatar}
          <Box
            component="span"
            sx={{
              flex: 1,
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {selected.name}
          </Box>
          {selected.place != null && (
            <Box
              component="span"
              sx={{
                fontSize: "0.8125rem",
                color: "text.secondary",
                whiteSpace: "nowrap",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              <Box
                component="span"
                sx={{ color: "text.primary", fontWeight: 600 }}
              >
                {ordinal(selected.place)}
              </Box>
              {" · "}
              {score}
            </Box>
          )}
        </Box>
      );
    }

    return (
      <Box
        component="span"
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          minWidth: 0,
          textAlign: "left",
        }}
      >
        {avatar}
        <Box component="span" sx={{ display: "grid", minWidth: 0 }}>
          <Box
            component="span"
            sx={{ fontWeight: 600, lineHeight: 1.3, whiteSpace: "nowrap" }}
          >
            {selected.name}
          </Box>
          <Box
            component="span"
            sx={{
              fontSize: "0.8125rem",
              lineHeight: 1.3,
              color: "text.secondary",
              whiteSpace: "nowrap",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {selected.place != null && `${ordinal(selected.place)} · `}
            {score} pts
            {selected.second_half_place != null &&
              ` · 2nd half ${ordinal(selected.second_half_place)}`}
            {asOfWeek != null && ` · as of week ${asOfWeek}`}
          </Box>
        </Box>
        {standings.length > 0 && (
          <>
            <Divider orientation="vertical" flexItem />
            <MoneyLines standings={standings} />
          </>
        )}
      </Box>
    );
  };

  return (
    <FormControl
      variant="standard"
      sx={{ minWidth: 150, flex: { xs: 1, md: "none" }, maxWidth: "100%" }}
    >
      <Box component="span" id="user-select-label" sx={visuallyHidden}>
        Player
      </Box>
      <Select
        // 40px tall on phones so it's an easy tap target.
        sx={{
          pl: summary === "card" ? 1.5 : "10px",
          py: summary === "card" ? 0.75 : 0,
          // The card's height with a player in it, so choosing yourself
          // doesn't make the header jump.
          minHeight: summary === "card" ? 59 : 40,
          borderRadius: summary === "card" ? "10px" : undefined,
          "& .MuiSelect-select": { minWidth: 0 },
        }}
        labelId="user-select-label"
        id="user-drop-down"
        value={user ?? ""}
        onChange={handleChange}
        open={open}
        onOpen={() => onOpenChange(true)}
        onClose={() => onOpenChange(false)}
        MenuProps={{ slotProps: { transition: { onExited: onMenuClosed } } }}
        displayEmpty
        renderValue={renderValue}
      >
        {/* Only to clear a choice; with no one chosen it would just be
            the highlighted first item when the menu opens. */}
        {user && (
          <MenuItem value="">
            <em>No one</em>
          </MenuItem>
        )}
        {users.map((userItem: RankedUser) => {
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
  );
}
