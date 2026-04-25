/**
 * プロテイン記録画面
 * - 今日の摂取量を入力・保存
 * - 1日の目標摂取量を設定
 * - 過去7日間の摂取量を棒グラフで表示
 */

import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  LinearScale,
  Tooltip,
} from 'chart.js';
import { useEffect, useMemo, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { lastNDays, loadData, setDailyProteinGoal, setProtein, todayString } from '../lib/storage';
import type { AppData } from '../lib/types';
import styles from './Protein.module.css';

// Chart.jsに必要なモジュールを登録
ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

export default function Protein() {
  const [data, setData] = useState<AppData | null>(null);
  const [amountInput, setAmountInput] = useState('');
  const [goalInput, setGoalInput] = useState('');
  const [saved, setSaved] = useState(false);
  const today = todayString();

  useEffect(() => {
    setData(loadData());
  }, []);

  const todayAmount = data?.protein.find((p) => p.date === today)?.amount ?? 0;
  const goal = data?.goals.dailyProtein ?? 150;
  const pct = Math.min((todayAmount / goal) * 100, 100);

  // 過去7日グラフデータ
  const chartData = useMemo(() => {
    const dates = lastNDays(7);
    return {
      labels: dates.map((d) => d.slice(5)), // MM-DD
      datasets: [{
        data: dates.map((d) => data?.protein.find((p) => p.date === d)?.amount ?? 0),
        backgroundColor: dates.map((d) =>
          d === today ? '#FF6B35' : 'rgba(255,107,53,0.3)'
        ),
        borderRadius: 6,
      }],
    };
  }, [data, today]);

  // 摂取量保存
  const handleSaveAmount = () => {
    const num = parseFloat(amountInput);
    if (isNaN(num) || num < 0) { alert('正しい数値を入力してください'); return; }
    const newData = setProtein(today, num);
    setData(newData);
    setAmountInput('');
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  // 目標保存
  const handleSaveGoal = () => {
    const num = parseFloat(goalInput);
    if (isNaN(num) || num <= 0) { alert('正しい数値を入力してください'); return; }
    const newData = setDailyProteinGoal(num);
    setData(newData);
    setGoalInput('');
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>プロテイン</h1>

      {/* 今日の状況カード */}
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

      {/* 摂取量入力 */}
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
          <button
            className={`${styles.saveBtn} ${saved ? styles.saveBtnDone : ''}`}
            onClick={handleSaveAmount}>
            {saved ? '✓' : '保存'}
          </button>
        </div>
      </div>

      {/* 目標設定 */}
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

      {/* 過去7日グラフ */}
      <div className={styles.card}>
        <p className={styles.cardTitle}>過去7日間</p>
        <Bar
          data={chartData}
          options={{
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
              y: {
                beginAtZero: true,
                ticks: { callback: (v) => `${v}g` },
                grid: { color: '#E5E7EB' },
              },
              x: { grid: { display: false } },
            },
          }}
        />
      </div>
    </div>
  );
}
