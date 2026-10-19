import { Button } from "../../ui/Button";
import { Icon } from "../../ui/Icon";
import { SegmentedControl } from "../../ui/SegmentedControl";

export type AdminView = "pipeline" | "roster";

// Pipeline or Roster, in ?view= like the other tabs' switches.
export const AdminViewSwitch = ({
  view,
  onChange,
}: {
  view: AdminView;
  onChange: (view: AdminView) => void;
}) => (
  <SegmentedControl
    value={view}
    onChange={onChange}
    label="Admin page"
    segments={[
      { value: "pipeline", children: "Pipeline" },
      { value: "roster", children: "Roster" },
    ]}
  />
);

// Full navigation, not a router link: /logout is a Worker redirect to
// Access's own logout endpoint, which clears the session.
export const LogoutButton = () => (
  <Button
    href="/logout"
    variant="outlined"
    size="small"
    startIcon={<Icon name="Logout" />}
  >
    Log out
  </Button>
);
