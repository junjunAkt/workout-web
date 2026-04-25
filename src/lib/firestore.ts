/**
 * Firestore を使ったデータ保存・読み込みのヘルパー関数
 * ユーザーIDごとにデータを管理する（デバイス間で同期される）
 */

import {
  doc,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import type { AppData, Workout } from './types';

// Firestore のデフォルトデータ
const defaultData: AppData = {
  workouts: [],
  protein: [],
  goals: {
    dailyProtein: 150,
    exerciseGoals: [],
  },
};

/**
 * Firestore からユーザーの全データを読み込む
 */
export async function loadDataFromFirestore(userId: string): Promise<AppData> {
  try {
    const ref = doc(db, 'users', userId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      return structuredClone(defaultData);
    }
    const data = snap.data() as AppData;
    return {
      workouts: data.workouts ?? [],
      protein: data.protein ?? [],
      goals: { ...defaultData.goals, ...(data.goals ?? {}) },
    };
  } catch (e) {
    console.error('データ読み込みエラー', e);
    return structuredClone(defaultData);
  }
}

/**
 * Firestore にユーザーの全データを保存する
 */
export async function saveDataToFirestore(userId: string, data: AppData): Promise<void> {
  try {
    const ref = doc(db, 'users', userId);
    await setDoc(ref, data);
  } catch (e) {
    console.error('データ保存エラー', e);
  }
}

/**
 * ワークアウトを追加する
 */
export async function addWorkoutToFirestore(userId: string, workout: Workout): Promise<AppData> {
  const data = await loadDataFromFirestore(userId);
  const existing = data.workouts.findIndex((w) => w.date === workout.date);
  if (existing >= 0) {
    data.workouts[existing].exercises.push(...workout.exercises);
  } else {
    data.workouts.push(workout);
  }
  await saveDataToFirestore(userId, data);
  return data;
}

/**
 * プロテイン摂取量を保存する（同日は上書き）
 */
export async function setProteinInFirestore(userId: string, date: string, amount: number): Promise<AppData> {
  const data = await loadDataFromFirestore(userId);
  const idx = data.protein.findIndex((p) => p.date === date);
  if (idx >= 0) {
    data.protein[idx].amount = amount;
  } else {
    data.protein.push({ date, amount });
  }
  await saveDataToFirestore(userId, data);
  return data;
}

/**
 * 1日のプロテイン目標を更新する
 */
export async function setDailyProteinGoalInFirestore(userId: string, amount: number): Promise<AppData> {
  const data = await loadDataFromFirestore(userId);
  data.goals.dailyProtein = amount;
  await saveDataToFirestore(userId, data);
  return data;
}

/**
 * 種目の目標重量を設定する
 */
export async function setExerciseGoalInFirestore(userId: string, name: string, targetWeight: number): Promise<AppData> {
  const data = await loadDataFromFirestore(userId);
  const idx = data.goals.exerciseGoals.findIndex((g) => g.name === name);
  if (idx >= 0) {
    data.goals.exerciseGoals[idx].targetWeight = targetWeight;
  } else {
    data.goals.exerciseGoals.push({ name, targetWeight });
  }
  await saveDataToFirestore(userId, data);
  return data;
}
