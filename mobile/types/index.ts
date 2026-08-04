/**
 * アプリ全体で使う型定義。
 * 保存フォーマットでもあるので、変更するときは lib/storage.ts のマイグレーションも意識すること。
 */

export type Category = '胸' | '背中' | '脚' | '肩' | '腕' | '腹' | '有酸素';

/** 回復率の計算対象になる部位（有酸素は対象外） */
export type TrackedPart = Exclude<Category, '有酸素'>;

export type Exercise = {
  /** プリセットは "preset_bench_press" 形式。自作は "ex_<timestamp>_<rand>" */
  id: string;
  name: string;
  category: Category;
  /** YouTube URL（後工程で使用。今は null 可） */
  videoUrl: string | null;
  isPreset: boolean;
  memo?: string;
};

export type SetLog = {
  weight: number;
  reps: number;
  rpe?: number;
};

export type SessionEntry = {
  exerciseId: string;
  sets: SetLog[];
};

export type Session = {
  id: string;
  /** 'YYYY-MM-DD' */
  date: string;
  /** ミリ秒。回復率計算＆タイマーに使う */
  startedAt: number;
  /** 終了時刻(ミリ秒) */
  endedAt?: number;
  /** 経過秒数 */
  durationSec?: number;
  entries: SessionEntry[];
};

/** 回復状態の表示情報（utils/recovery.ts の getRecoveryState が返す） */
export type RecoveryState = {
  label: string;
  level: 1 | 2 | 3 | 4 | null;
  color: string;
};

/** 回復画面で1部位ぶんをまとめたビューモデル */
export type PartRecovery = {
  part: TrackedPart;
  lastTrainedAt: number | null;
  /** 0..1。未実施は null */
  rate: number | null;
  remainingHours: number;
  state: RecoveryState;
};
