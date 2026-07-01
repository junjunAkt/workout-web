/**
 * 読書管理アプリ専用のレイアウトコンポーネント
 * ログイン必須。ログイン後にGoogleアカウントでデータをFirestoreに保存する。
 */

import { Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import styles from './ReadingLayout.module.css';

export default function ReadingLayout() {
  const { user, loading, signInWithGoogle, logout } = useAuth();

  // ログイン状態確認中
  if (loading) {
    return (
      <div className={styles.loadingPage}>
        <div className={styles.loadingIcon}>📚</div>
      </div>
    );
  }

  // 未ログイン → ログイン画面
  if (!user) {
    return (
      <div className={styles.loginPage}>
        <div className={styles.loginContent}>
          <div className={styles.loginIcon}>📚</div>
          <h1 className={styles.loginTitle}>読書管理</h1>
          <p className={styles.loginDesc}>
            読書の記録を残して、読書習慣を積み上げましょう。
            <br />
            Googleアカウントでログインすると、どのデバイスからでもデータにアクセスできます。
          </p>
          <button className={styles.googleBtn} onClick={signInWithGoogle}>
            Googleでログイン
          </button>
        </div>
      </div>
    );
  }

  // ログイン済み → 読書アプリ本体
  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.headerIcon}>📚</span>
          <span className={styles.headerTitle}>読書管理</span>
        </div>
        <button className={styles.logoutBtn} onClick={logout}>
          ログアウト
        </button>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
