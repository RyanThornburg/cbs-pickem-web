import { ReactNode } from "react";
import styles from "./AdminAlert.module.css";

export type AlertSeverity = "success" | "warning" | "error";

// MUI's outlined-style Alert icons (its internal SuccessOutlined,
// ReportProblemOutlined and ErrorOutline).
const ICON_PATHS: Record<AlertSeverity, string> = {
  success:
    "M20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4C12.76,4 13.5,4.11 14.2, 4.31L15.77,2.74C14.61,2.26 13.34,2 12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0, 0 22,12M7.91,10.08L6.5,11.5L11,16L21,6L19.59,4.58L11,13.17L7.91,10.08Z",
  warning:
    "M12 5.99L19.53 19H4.47L12 5.99M12 2L1 21h22L12 2zm1 14h-2v2h2v-2zm0-6h-2v4h2v-4z",
  error:
    "M11 15h2v2h-2zm0-8h2v6h-2zm.99-5C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z",
};

// The pipeline page's banner: MUI's standard Alert as Admin drew it. The
// shared theme painted every Alert orange (a leftover from the MUI
// template), which would make a healthy heartbeat and a dead one look
// alike, so Admin re-colors by severity rather than changing Alerts
// app-wide.
export function AdminAlert({
  severity,
  action,
  children,
}: {
  severity: AlertSeverity;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div role="alert" className={`${styles.alert} ${styles[severity]}`}>
      <div className={styles.icon}>
        <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
          <path d={ICON_PATHS[severity]} />
        </svg>
      </div>
      <div className={styles.message}>{children}</div>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
