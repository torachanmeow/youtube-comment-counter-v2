import styles from './Header.module.css';

export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <span className={styles.icon}>&#9654;</span>
        <h1 className={styles.title}>YouTube Comment Counter</h1>
      </div>
      <p className={styles.subtitle}>ライブ配信のコメント・スパチャをリアルタイム集計</p>
    </header>
  );
}
