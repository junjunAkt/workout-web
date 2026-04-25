/**
 * ログイン画面
 * Googleアカウントでサインインする
 */

import { useAuth } from '../contexts/AuthContext';
import styles from './Login.module.css';

export default function Login() {
  const { signInWithGoogle } = useAuth();

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {/* アイコン */}
        <div className={styles.icon}>💪</div>

        <h1 className={styles.title}>筋トレ記録</h1>
        <p className={styles.subtitle}>
          Googleアカウントでログインすると<br />
          どのデバイスからでもデータが同期されます
        </p>

        <button className={styles.googleBtn} onClick={signInWithGoogle}>
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google"
            className={styles.googleIcon}
          />
          Googleでログイン
        </button>
      </div>
    </div>
  );
}
