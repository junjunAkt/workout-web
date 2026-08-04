import AsyncStorage from '@react-native-async-storage/async-storage';

import { PRESET_EXERCISES } from '@/constants/presets';
import type { Exercise, Session } from '@/types';

/**
 * 永続化レイヤー。
 *
 * 画面からは AsyncStorage を直接触らず、必ずこのモジュール経由でアクセスすること。
 * 将来 Firebase 同期や HealthKit 連携を足すときは、ここのシグネチャを保ったまま
 * 内部実装だけ差し替えられるようにしてある。
 */

const KEYS = {
  exercises: 'exercises',
  sessions: 'sessions',
  /** 進行中ワークアウト（アプリを閉じても計測が続くように保持する） */
  activeSession: 'activeSession',
} as const;

// ---------------------------------------------------------------------------
// 低レベルユーティリティ
// ---------------------------------------------------------------------------

async function readJson<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  } catch (e) {
    // 壊れたデータでアプリが起動不能にならないよう、握りつぶして初期値に倒す
    console.warn(`[storage] ${key} の読み込みに失敗しました`, e);
    return null;
  }
}

async function writeJson(key: string, value: unknown): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

async function readArray<T>(key: string): Promise<T[]> {
  const value = await readJson<T[]>(key);
  return Array.isArray(value) ? value : [];
}

/** 自作データ用の簡易ID */
export function createId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// ---------------------------------------------------------------------------
// 種目
// ---------------------------------------------------------------------------

export async function getExercises(): Promise<Exercise[]> {
  return readArray<Exercise>(KEYS.exercises);
}

export async function saveExercises(exercises: Exercise[]): Promise<void> {
  await writeJson(KEYS.exercises, exercises);
}

/** 同じ id があれば更新、無ければ追加 */
export async function upsertExercise(exercise: Exercise): Promise<Exercise[]> {
  const exercises = await getExercises();
  const index = exercises.findIndex((e) => e.id === exercise.id);
  if (index >= 0) {
    exercises[index] = exercise;
  } else {
    exercises.push(exercise);
  }
  await saveExercises(exercises);
  return exercises;
}

export async function deleteExercise(id: string): Promise<Exercise[]> {
  const exercises = (await getExercises()).filter((e) => e.id !== id);
  await saveExercises(exercises);
  return exercises;
}

/**
 * プリセット種目を投入する。
 * 既存データがある場合は「id が無いものだけ追加」するマージなので、
 * ユーザーが編集した videoUrl / memo / name は上書きされない。
 */
export async function seedPresetExercises(): Promise<Exercise[]> {
  const existing = await getExercises();
  const existingIds = new Set(existing.map((e) => e.id));
  const missing = PRESET_EXERCISES.filter((preset) => !existingIds.has(preset.id));

  if (missing.length === 0) return existing;

  const merged = [...existing, ...missing];
  await saveExercises(merged);
  return merged;
}

// ---------------------------------------------------------------------------
// セッション（トレーニング記録）
// ---------------------------------------------------------------------------

export async function getSessions(): Promise<Session[]> {
  return readArray<Session>(KEYS.sessions);
}

export async function saveSessions(sessions: Session[]): Promise<void> {
  await writeJson(KEYS.sessions, sessions);
}

/** 同じ id があれば更新、無ければ追加。startedAt の新しい順に整列して保存する */
export async function upsertSession(session: Session): Promise<Session[]> {
  const sessions = await getSessions();
  const index = sessions.findIndex((s) => s.id === session.id);
  if (index >= 0) {
    sessions[index] = session;
  } else {
    sessions.push(session);
  }
  sessions.sort((a, b) => b.startedAt - a.startedAt);
  await saveSessions(sessions);
  return sessions;
}

export async function deleteSession(id: string): Promise<Session[]> {
  const sessions = (await getSessions()).filter((s) => s.id !== id);
  await saveSessions(sessions);
  return sessions;
}

// ---------------------------------------------------------------------------
// 進行中ワークアウト
// ---------------------------------------------------------------------------

export async function getActiveSession(): Promise<Session | null> {
  const session = await readJson<Session>(KEYS.activeSession);
  if (!session || typeof session.startedAt !== 'number') return null;
  return { ...session, entries: Array.isArray(session.entries) ? session.entries : [] };
}

export async function setActiveSession(session: Session | null): Promise<void> {
  if (session === null) {
    await AsyncStorage.removeItem(KEYS.activeSession);
    return;
  }
  await writeJson(KEYS.activeSession, session);
}

// ---------------------------------------------------------------------------
// 開発用
// ---------------------------------------------------------------------------

/** 全データ削除（デバッグ用。UIからは呼んでいない） */
export async function clearAll(): Promise<void> {
  await AsyncStorage.multiRemove([KEYS.exercises, KEYS.sessions, KEYS.activeSession]);
}
