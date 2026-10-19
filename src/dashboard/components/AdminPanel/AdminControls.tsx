import { ReactNode } from "react";
import { Button } from "../../ui/Button";
import { Icon } from "../../ui/Icon";
import { SegmentedControl } from "../../ui/SegmentedControl";
import styles from "./AdminControls.module.css";

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

// The controls on both views' TabIntro row: the view switch, then buttons.
export const AdminActions = ({ children }: { children: ReactNode }) => (
  <div className={styles.actions}>{children}</div>
);
