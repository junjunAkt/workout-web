import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { ExerciseMaster } from './exercise-types';
import { PRESET_EXERCISES } from './exercise-presets';

const FIRESTORE_COLLECTION = 'users';

async function loadExercises(userId: string): Promise<ExerciseMaster[]> {
  try {
    const ref = doc(db, FIRESTORE_COLLECTION, userId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return [];
    const data = snap.data();
    return (data.exerciseMasters as ExerciseMaster[]) ?? [];
  } catch (e) {
    console.error('種目データ読み込みエラー', e);
    return [];
  }
}

async function saveExercises(userId: string, exercises: ExerciseMaster[]): Promise<void> {
  try {
    const ref = doc(db, FIRESTORE_COLLECTION, userId);
    const snap = await getDoc(ref);
    const existing = snap.exists() ? snap.data() : {};
    await setDoc(ref, { ...existing, exerciseMasters: exercises });
  } catch (e) {
    console.error('種目データ保存エラー', e);
  }
}

export async function loadExerciseMasters(userId: string): Promise<ExerciseMaster[]> {
  const stored = await loadExercises(userId);

  if (stored.length === 0) {
    await saveExercises(userId, PRESET_EXERCISES);
    return [...PRESET_EXERCISES];
  }

  const existingIds = new Set(stored.map((e) => e.id));
  const newPresets = PRESET_EXERCISES.filter((p) => !existingIds.has(p.id));
  if (newPresets.length > 0) {
    const merged = [...stored, ...newPresets];
    await saveExercises(userId, merged);
    return merged;
  }

  return stored;
}

export async function saveExerciseMaster(userId: string, exercise: ExerciseMaster): Promise<ExerciseMaster[]> {
  const all = await loadExercises(userId);
  const idx = all.findIndex((e) => e.id === exercise.id);
  if (idx >= 0) {
    all[idx] = exercise;
  } else {
    all.push(exercise);
  }
  await saveExercises(userId, all);
  return all;
}

export async function deleteExerciseMaster(userId: string, exerciseId: string): Promise<ExerciseMaster[]> {
  const all = await loadExercises(userId);
  const filtered = all.filter((e) => e.id !== exerciseId);
  await saveExercises(userId, filtered);
  return filtered;
}
