/**
 * アプリ全体で使う型定義
 */

// 1セットのデータ（重量と回数）
export type WorkoutSet = {
  weight: number; // kg
  reps: number;   // 回数
};

// 1種目のデータ
export type Exercise = {
  name: string;
  sets: WorkoutSet[];
};

// 1日分のトレーニング記録
export type Workout = {
  id: string;
  date: string; // YYYY-MM-DD
  exercises: Exercise[];
};

// プロテイン摂取記録
export type ProteinRecord = {
  date: string; // YYYY-MM-DD
  amount: number; // g
};

// 種目ごとの目標重量
export type ExerciseGoal = {
  name: string;
  targetWeight: number;
};

// 設定・目標値
export type Goals = {
  dailyProtein: number;
  exerciseGoals: ExerciseGoal[];
};

// アプリ全データ
export type AppData = {
  workouts: Workout[];
  protein: ProteinRecord[];
  goals: Goals;
};
