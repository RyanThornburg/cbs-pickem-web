import { Button, ToggleButton, ToggleButtonGroup } from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";

export type AdminView = "pipeline" | "roster";

// Pipeline or Roster, in ?view= like the other tabs' switches.
export const AdminViewSwitch = ({
  view,
  onChange,
}: {
  view: AdminView;
  onChange: (view: AdminView) => void;
}) => (
  <ToggleButtonGroup
    size="small"
    exclusive
    value={view}
    // Exclusive, so pressing the shown view again sends null: ignore it.
    onChange={(_e, value: AdminView | null) => value && onChange(value)}
    aria-label="Admin page"
  >
    <ToggleButton value="pipeline">Pipeline</ToggleButton>
    <ToggleButton value="roster">Roster</ToggleButton>
  </ToggleButtonGroup>
);

// Full navigation, not a router link: /logout is a Worker redirect to
// Access's own logout endpoint, which clears the session.
export const LogoutButton = () => (
  <Button
    href="/logout"
    variant="outlined"
    size="small"
    startIcon={<LogoutIcon />}
  >
    Log out
  </Button>
);
