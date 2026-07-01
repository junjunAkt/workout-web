/**
 * 読書管理アプリ専用のレイアウトコンポーネント
 * 筋トレアプリとは完全に独立したナビゲーションを持つ
 */

import { Outlet } from 'react-router-dom';
import styles from './ReadingLayout.module.css';

export default function ReadingLayout() {
  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <span className={styles.headerIcon}>📚</span>
        <span className={styles.headerTitle}>読書管理</span>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
