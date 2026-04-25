/**
 * プロテイン記録画面 - Firestore対応版
 */

import { BarElement, CategoryScale, Chart as ChartJS, LinearScale, Tooltip } from 'chart.js';
import { useEffect, useMemo, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { useAuth } from '../contexts/AuthContext';
import { loadDataFromFirestore, setDailyProteinGoalInFirestore, setProteinInFirestore } from '../lib/firestore';
import { lastNDays, todayString } from '../lib/storage';
import type { AppData } from '../lib/types';
import styles from './Protein.module.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

export default function Protein() {
  const { user } = useAuth();
  const [data, setData] = useState<AppData | null>(null);
  const [amountInput, setAmountInput] = useState('');
  const [goalInput, setGoalInput] = useState('');
  const [saved, setSaved] = useState(false);
  const today = todayString();

  useEffect(() => {
    if (user) {
      loadDataFromFirestore(user.uid).then(setData);
    }
  }, [user]);

  const todayAmount = data?.protein.find((p) => p.date === today)?.amount ?? 0;
  const goal = data?.goals.dailyProtein ?? 150;
  const pct = Math.min((todayAmount / goal) * 100, 100);

  const chartData = useMemo(() => {
    const dates = lastNDays(7);
    return {
      labels: dates.map((d) => d.slice(5)),
      datasets: [{
        data: dates.map((d) => data?.protein.find((p) => p.date === d)?.amount ?? 0),
        backgroundColor: dates.map((d) => d === today ? '#FF6B35' : 'rgba(255,107,53,0.3)'),
        borderRadius: 6,
      }],
    };
  }, [data, today]);

  const handleSaveAmount = async () => {
    if (!user) return;
    const num = parseFloat(amountInput);
    if (isNaN(num) || num < 0) { alert('正しい数値を入力してください'); return; }
    const newData = await setProteinInFirestore(user.uid, today, num);
    setData(newData);
    setAmountInput('');
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const handleSaveGoal = async () => {
    if (!user) return;
    const num = parseFloat(goalInput);
    if (isNaN(num) || num <= 0) { alert('正しい数値を入力してください'); return; }
    const newData = await setDailyProteinGoalInFirestore(user.uid, num);
    setData(newData);
    setGoalInput('');
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>プロテイン</h1>

      <div className={styles.card}>
        <p className={styles.cardTitle}>今日の摂取量</p>
        <div className={styles.amountRow}>
          <span className={styles.amount}>{todayAmount}</span>
          <span className={styles.unit}>/ {goal} g</span>
        </div>
        <div className={styles.progressBg}>
          <div className={styles.progressFill} style={{ width: `${pct}%` }} />
        </div>
        <p className={styles.progressLabel}>{Math.round(pct)}% 達成</p>
      </div>

      <div className={styles.card}>
        <p className={styles.cardTitle}>摂取量を記録（今日の合計を上書き）</p>
        <div className={styles.inputRow}>
          <input
            className={styles.input}
            type="number"
            inputMode="decimal"
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            placeholder="例: 120"
          />
          <span className={styles.inputUnit}>g</span>
          <button className={`${styles.saveBtn} ${saved ? styles.saveBtnDone : ''}`} onClick={handleSaveAmount}>
            {saved ? '✓' : '保存'}
          </button>
        </div>
      </div>

      <div className={styles.card}>
        <p className={styles.cardTitle}>1日の目標摂取量（現在: {goal} g）</p>
        <div className={styles.inputRow}>
          <input
            className={styles.input}
            type="number"
            inputMode="decimal"
            value={goalInput}
            onChange={(e) => setGoalInput(e.target.value)}
            placeholder={`${goal}`}
          />
          <span className={styles.inputUnit}>g</span>
          <button className={styles.saveBtn} onClick={handleSaveGoal}>設定</button>
        </div>
      </div>

      <div className={styles.card}>
        <p className={styles.cardTitle}>過去7日間</p>
        <Bar data={chartData} options={{
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, ticks: { callback: (v) => `${v}g` }, grid: { color: '#E5E7EB' } },
            x: { grid: { display: false } },
          },
        }} />
      </div>
    </div>
  );
}
