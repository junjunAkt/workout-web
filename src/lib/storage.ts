/**
 * localStorageを使ったデータ保存・読み込みのヘルパー関数群
 * ブラウザのlocalStorageに端末内ローカル保存される
 */

import type { AppData, Workout, Goals } from './types';

const STORAGE_KEY = 'workout_app_data_v1';

// 初期データ（何もない状態）
const defaultData: AppData = {
  workouts: [],
  protein: [],
  goals: {
    dailyProtein: 150,
    exerciseGoals: [],
  },
};

/** 全データをlocalStorageから読み込む */
export function loadData(): AppData {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    if (!json) return structuredClone(defaultData);
    const parsed = JSON.parse(json) as AppData;
    return {
      workouts: parsed.workouts ?? [],
      protein: parsed.protein ?? [],
      goals: { ...defaultData.goals, ...(parsed.goals ?? {}) },
    };
  } catch {
    return structuredClone(defaultData);
  }
}

/** 全データをlocalStorageに保存する */
export function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ---- ワークアウト関連 ----

/** 新しいワークアウトを追加（同じ日の記録があれば種目を追記） */
export function addWorkout(workout: Workout): AppData {
  const data = loadData();
  const existing = data.workouts.findIndex((w) => w.date === workout.date);
  if (existing >= 0) {
    data.workouts[existing].exercises.push(...workout.exercises);
  } else {
    data.workouts.push(workout);
  }
  saveData(data);
  return data;
}

// ---- プロテイン関連 ----

/** プロテイン摂取量を保存（同日は上書き） */
export function setProtein(date: string, amount: number): AppData {
  const data = loadData();
  const idx = data.protein.findIndex((p) => p.date === date);
  if (idx >= 0) {
    data.protein[idx].amount = amount;
  } else {
    data.protein.push({ date, amount });
  }
  saveData(data);
  return data;
}

// ---- 目標関連 ----

/** 1日のプロテイン目標を更新 */
export function setDailyProteinGoal(amount: number): AppData {
  const data = loadData();
  data.goals.dailyProtein = amount;
  saveData(data);
  return data;
}

/** 種目ごとの目標重量を設定 */
export function setExerciseGoal(name: string, targetWeight: number): AppData {
  const data = loadData();
  const idx = data.goals.exerciseGoals.findIndex((g) => g.name === name);
  if (idx >= 0) {
    data.goals.exerciseGoals[idx].targetWeight = targetWeight;
  } else {
    data.goals.exerciseGoals.push({ name, targetWeight });
  }
  saveData(data);
  return data;
}

// ---- ユーティリティ ----

/** 今日の日付を YYYY-MM-DD 形式で取得 */
export function todayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** シンプルなID生成 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** 過去N日間の日付配列を返す（古い順） */
export function lastNDays(n: number): string[] {
  const arr: string[] = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    arr.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  }
  return arr;
}
