import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { RankedUser } from "../../types";
import { focusRingColor } from "../../shared-theme/themePrimitives";
import TabIntro from "../TabIntro";
import TabSkeleton from "../TabSkeleton";
import UserAvatar from "../UserAvatar";

// The You tab with no one selected: pick a name to select that player (same
// as the header picker) and open their page.
export default function PlayerChooser({
  userList,
  onChoose,
}: {
  userList: RankedUser[];
  onChoose: (id: string) => void;
}) {
  const roster = [...userList].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  );
  return (
    <Box sx={{ textAlign: "left" }}>
      <TabIntro title="Who are you?" />
      <Typography
        variant="body2"
        sx={{ color: "text.secondary", mt: -1, mb: 2, maxWidth: "60ch" }}
      >
        Pick your name to see your page and your picks highlighted on every tab.
        It's saved on this device only.
      </Typography>
      {roster.length === 0 ? (
        <TabSkeleton shape="rows" label="Loading the players" />
      ) : (
        <Box
          component="ul"
          sx={{
            listStyle: "none",
            m: 0,
            p: 0,
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(3, 1fr)",
            },
            columnGap: 2,
          }}
        >
          {roster.map((user) => (
            <li key={user.id}>
              <ButtonBase
                onClick={() => onChoose(user.id)}
                sx={{
                  width: "100%",
                  justifyContent: "flex-start",
                  gap: 1,
                  px: 1,
                  py: 1,
                  borderRadius: 1,
                  textAlign: "left",
                  fontSize: "0.875rem",
                  "&:hover": { bgcolor: "hsl(220, 35%, 97%)" },
                  "&:focus-visible": {
                    outline: `2px solid ${focusRingColor}`,
                    outlineOffset: -2,
                  },
                }}
              >
                <UserAvatar
                  userId={user.id}
                  userName={user.name}
                  size={24}
                  includeName={false}
                />
                <Box component="span" sx={{ flex: 1, minWidth: 0 }}>
                  {user.name}
                </Box>
                <ChevronRightIcon
                  aria-hidden
                  sx={{ color: "text.disabled", fontSize: "1.1rem" }}
                />
              </ButtonBase>
            </li>
          ))}
        </Box>
      )}
    </Box>
  );
}
