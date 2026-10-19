import { CSSProperties, ReactNode } from "react";
import { Button } from "../../ui/Button";
import { Icon } from "../../ui/Icon";
import styles from "./LoadError.module.css";

// The one way a tab says it couldn't load something: a quiet bordered box
// (not an orange alert; nothing the viewer did is wrong) with what failed,
// when it tries again on its own, and a Try now button. With no `onRetry`
// it's a plain note for things that aren't there at all ("There's no team
// at …"), in the same box.
export default function LoadError({
  title,
  detail,
  onRetry,
  actions,
  style,
}: {
  title: ReactNode;
  // The automatic retry, e.g. "Trying again every minute."
  detail?: ReactNode;
  onRetry?: () => void;
  // Extra buttons before Try now (the app shell's "Pool on CBS").
  actions?: ReactNode;
  // Spacing from the page around it (callers still on MUI pass a margin).
  style?: CSSProperties;
}) {
  return (
    <div
      role={onRetry ? "alert" : "status"}
      className={styles.box}
      style={style}
    >
      <Icon
        name={onRetry ? "ErrorOutlineOutlined" : "InfoOutlined"}
        className={styles.icon}
      />
      <div className={styles.text}>
        <p className={styles.title}>{title}</p>
        {detail && <p className={styles.detail}>{detail}</p>}
      </div>
      {(actions || onRetry) && (
        <div className={styles.actions}>
          {actions}
          {onRetry && (
            <Button variant="outlined" size="small" onClick={onRetry}>
              Try now
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
