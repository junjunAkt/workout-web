/**
 * ホーム画面（Today）- Firestore対応版
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { loadDataFromFirestore } from '../lib/firestore';
import { todayString } from '../lib/storage';
import type { AppData } from '../lib/types';
import styles from './Home.module.css';

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const week = ['日', '月', '火', '水', '木', '金', '土'][d.getDay()];
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日(${week})`;
}

export default function Home() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [data, setData] = useState<AppData | null>(null);
  const today = todayString();

  useEffect(() => {
    if (user) {
      loadDataFromFirestore(user.uid).then(setData);
    }
  }, [user]);

  const todayWorkout = data?.workouts.find((w) => w.date === today);
  const exerciseCount = todayWorkout?.exercises.length ?? 0;
  const totalSets = todayWorkout?.exercises.reduce((s, e) => s + e.sets.length, 0) ?? 0;
  const todayProtein = data?.protein.find((p) => p.date === today)?.amount ?? 0;
  const proteinGoal = data?.goals.dailyProtein ?? 150;
  const proteinPct = Math.min((todayProtein / proteinGoal) * 100, 100);

  return (
    <div className={styles.page}>
      {/* ヘッダー（ユーザー名とログアウト） */}
      <div className={styles.topBar}>
        <span className={styles.userName}>{user?.displayName?.split(' ')[0]}さん</span>
        <button className={styles.logoutBtn} onClick={logout}>ログアウト</button>
      </div>

      <div className={styles.header}>
        <p className={styles.dateLabel}>{formatDate(today)}</p>
        <h1 className={styles.title}>今日</h1>
      </div>

      <div className={styles.card}>
        <p className={styles.cardTitle}>トレーニング</p>
        <div className={styles.statsRow}>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{exerciseCount}</span>
            <span className={styles.statLabel}>種目</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{totalSets}</span>
            <span className={styles.statLabel}>セット</span>
          </div>
        </div>
        {exerciseCount === 0 && (
          <p className={styles.emptyHint}>まだ記録がありません</p>
        )}
      </div>

      <div className={styles.card}>
        <p className={styles.cardTitle}>プロテイン</p>
        <div className={styles.proteinRow}>
          <span className={styles.proteinAmount}>{todayProtein}</span>
          <span className={styles.proteinUnit}>/ {proteinGoal} g</span>
        </div>
        <div className={styles.progressBg}>
          <div className={styles.progressFill} style={{ width: `${proteinPct}%` }} />
        </div>
        <p className={styles.progressLabel}>{Math.round(proteinPct)}% 達成</p>
      </div>

      <button className={styles.primaryBtn} onClick={() => navigate('/workout')}>
        今日のトレーニングを記録する
      </button>
    </div>
  );
}
