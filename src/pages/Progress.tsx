/**
 * 進捗グラフ画面 - Firestore対応版
 */

import { CategoryScale, Chart as ChartJS, Legend, LinearScale, LineElement, PointElement, Title, Tooltip } from 'chart.js';
import { useEffect, useMemo, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { useAuth } from '../contexts/AuthContext';
import { loadDataFromFirestore, setExerciseGoalInFirestore } from '../lib/firestore';
import type { AppData } from '../lib/types';
import styles from './Progress.module.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function Progress() {
  const { user } = useAuth();
  const [data, setData] = useState<AppData | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [goalInput, setGoalInput] = useState('');

  useEffect(() => {
    if (user) {
      loadDataFromFirestore(user.uid).then((d) => {
        setData(d);
        const first = d.workouts[0]?.exercises[0]?.name ?? null;
        if (first) setSelected(first);
      });
    }
  }, [user]);

  const exerciseNames = useMemo(() => {
    const names = new Set<string>();
    data?.workouts.forEach((w) => w.exercises.forEach((e) => names.add(e.name)));
    return Array.from(names);
  }, [data]);

  const chartData = useMemo(() => {
    if (!data || !selected) return null;
    const points = [...data.workouts]
      .filter((w) => w.exercises.some((e) => e.name === selected))
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((w) => ({
        date: w.date.slice(5),
        weight: Math.max(...w.exercises.filter((e) => e.name === selected).flatMap((e) => e.sets.map((s) => s.weight))),
      }));
    if (points.length === 0) return null;
    return {
      labels: points.map((p) => p.date),
      datasets: [{
        label: '最大重量 (kg)',
        data: points.map((p) => p.weight),
        borderColor: '#FF6B35',
        backgroundColor: 'rgba(255,107,53,0.12)',
        pointBackgroundColor: '#FF6B35',
        tension: 0.3,
        fill: true,
      }],
    };
  }, [data, selected]);

  const currentGoal = data?.goals.exerciseGoals.find((g) => g.name === selected)?.targetWeight;

  const handleSaveGoal = async () => {
    if (!user || !selected) return;
    const num = parseFloat(goalInput);
    if (isNaN(num) || num <= 0) { alert('正しい重量を入力してください'); return; }
    const newData = await setExerciseGoalInFirestore(user.uid, selected, num);
    setData(newData);
    setGoalInput('');
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>進捗</h1>

      {exerciseNames.length === 0 ? (
        <p className={styles.empty}>まだ記録がありません{'\n'}「記録」タブから始めましょう</p>
      ) : (
        <>
          <p className={styles.label}>種目を選択</p>
          <div className={styles.chips}>
            {exerciseNames.map((name) => (
              <button
                key={name}
                className={`${styles.chip} ${name === selected ? styles.chipActive : ''}`}
                onClick={() => setSelected(name)}>
                {name}
              </button>
            ))}
          </div>

          {chartData ? (
            <div className={styles.chartCard}>
              <p className={styles.chartCaption}>最大重量の推移</p>
              <Line data={chartData} options={{
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                  y: { ticks: { callback: (v) => `${v}kg` }, grid: { color: '#E5E7EB' } },
                  x: { grid: { display: false } },
                },
              }} />
            </div>
          ) : (
            <p className={styles.empty}>この種目のデータがありません</p>
          )}

          <div className={styles.goalCard}>
            <p className={styles.cardTitle}>目標重量</p>
            {currentGoal !== undefined && (
              <p className={styles.currentGoal}>現在の目標: {currentGoal} kg</p>
            )}
            <div className={styles.goalRow}>
              <input
                className={styles.goalInput}
                type="number"
                inputMode="decimal"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                placeholder="目標 (kg)"
              />
              <button className={styles.goalBtn} onClick={handleSaveGoal}>設定</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
