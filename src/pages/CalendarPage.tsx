/**
 * カレンダー・履歴画面
 * - 月表示カレンダー（記録した日にマーク）
 * - 日付をクリックでその日の詳細を表示
 */

import { useEffect, useMemo, useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { loadData, todayString } from '../lib/storage';
import type { AppData } from '../lib/types';
import styles from './CalendarPage.module.css';

type CalendarValue = Date | null;

export default function CalendarPage() {
  const [data, setData] = useState<AppData | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(todayString());

  useEffect(() => {
    setData(loadData());
  }, []);

  // 記録のある日付の集合
  const workoutDates = useMemo(() => {
    return new Set(data?.workouts.map((w) => w.date) ?? []);
  }, [data]);

  // 選択日のワークアウト
  const selectedWorkout = data?.workouts.find((w) => w.date === selectedDate);

  // 日付を YYYY-MM-DD 文字列に変換
  const toDateStr = (d: Date): string =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>履歴</h1>

      {/* react-calendar */}
      <div className={styles.calendarWrap}>
        <Calendar
          locale="ja-JP"
          onClickDay={(date: Date) => setSelectedDate(toDateStr(date))}
          value={new Date(selectedDate + 'T00:00:00')}
          tileClassName={({ date }: { date: Date }) => {
            const str = toDateStr(date);
            if (workoutDates.has(str)) return styles.hasRecord;
            return null;
          }}
        />
      </div>

      {/* 選択日の詳細 */}
      <div className={styles.detail}>
        <p className={styles.detailDate}>{selectedDate}</p>
        {selectedWorkout?.exercises.length ? (
          selectedWorkout.exercises.map((ex, i) => (
            <div key={i} className={styles.exerciseCard}>
              <p className={styles.exerciseName}>{ex.name}</p>
              {ex.sets.map((set, j) => (
                <div key={j} className={styles.setLine}>
                  <span className={styles.setLineNum}>{j + 1}</span>
                  <span>{set.weight} kg × {set.reps} 回</span>
                </div>
              ))}
            </div>
          ))
        ) : (
          <p className={styles.empty}>この日の記録はありません</p>
        )}
      </div>
    </div>
  );
}
