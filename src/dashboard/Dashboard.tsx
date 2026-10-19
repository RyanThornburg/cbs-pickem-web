import MainGrid from "./components/MainGrid";
import styles from "./Dashboard.module.css";

export default function Dashboard() {
  return (
    <div className={styles.frame}>
      <main className={styles.main}>
        <div className={styles.column}>
          <MainGrid />
        </div>
      </main>
    </div>
  );
}
