import { RankedUser } from "../../types";
import TabIntro from "../TabIntro";
import TabSkeleton from "../TabSkeleton";
import UserAvatar from "../UserAvatar";
import { Icon } from "../../ui/Icon";
import uiStyles from "../../ui/ui.module.css";
import styles from "./PlayerChooser.module.css";

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
    <div className={styles.page}>
      <TabIntro title="Who are you?" />
      <p className={styles.intro}>
        Pick your name to see your page and your picks highlighted on every tab.
        It's saved on this device only.
      </p>
      {roster.length === 0 ? (
        <TabSkeleton shape="rows" label="Loading the players" />
      ) : (
        <ul className={styles.list}>
          {roster.map((user) => (
            <li key={user.id}>
              <button
                type="button"
                onClick={() => onChoose(user.id)}
                className={`${uiStyles.plainButton} ${styles.choice}`}
              >
                <UserAvatar
                  userId={user.id}
                  userName={user.name}
                  size={24}
                  includeName={false}
                />
                <span className={styles.name}>{user.name}</span>
                <Icon name="ChevronRight" className={styles.chevron} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
