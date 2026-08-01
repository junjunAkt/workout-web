/**
 * 部位別回復率の計算ロジック（純粋関数のみ・読み取り専用）
 * 既存の記録(Workout)と種目マスタ(ExerciseMaster)を読むだけで、書き込みは一切しない。
 */

import type { Workout } from './types';
import type { ExerciseMaster } from './exercise-types';
import type { MusclePart } from './recovery-constants';
import {
  RECOVERY_HOURS,
  TRACKED_PARTS,
  ASSUMED_WORKOUT_HOUR,
  RECOMMEND_THRESHOLD,
} from './recovery-constants';

const HOUR_MS = 3_600_000;

/**
 * YYYY-MM-DD をローカル時間のタイムスタンプ(ミリ秒)に変換する。
 * 実施時刻が記録に無いため ASSUMED_WORKOUT_HOUR 時に実施したと仮定する。
 * 不正な日付は null を返す（既存データを壊さないためスキップ用）。
 */
function dateToTimestamp(dateStr: string): number | null {
  if (typeof dateStr !== 'string') return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!m) return null;
  const ts = new Date(
    Number(m[1]),
    Number(m[2]) - 1,
    Number(m[3]),
    ASSUMED_WORKOUT_HOUR,
  ).getTime();
  return Number.isFinite(ts) ? ts : null;
}

/**
 * 部位ごとの「最後に実施した日時(ミリ秒)」を返す。
 * 記録は種目名で保持されているため、種目マスタと name で結合して category を得る。
 * '有酸素' と、マスタに存在しない種目名はスキップする。
 */
export function getLastTrainedAtByPart(
  workouts: Workout[],
  exercises: ExerciseMaster[],
): Record<MusclePart, number | null> {
  const categoryByName = new Map<string, string>();
  for (const ex of exercises) {
    categoryByName.set(ex.name, ex.category);
  }

  const result: Record<MusclePart, number | null> = {
    '胸': null,
    '背中': null,
    '脚': null,
    '肩': null,
    '腕': null,
    '腹': null,
  };

  for (const workout of workouts) {
    const ts = dateToTimestamp(workout?.date);
    if (ts == null) continue;

    for (const entry of workout.exercises ?? []) {
      const category = categoryByName.get(entry?.name);
      if (!category || category === '有酸素') continue;
      const part = category as MusclePart;
      if (!TRACKED_PARTS.includes(part)) continue;
      if (result[part] == null || ts > result[part]) {
        result[part] = ts;
      }
    }
  }

  return result;
}

/**
 * 回復率を返す。0=トレ直後、1=回復済み。未実施(null)は null のまま返す。
 */
export function getRecoveryRate(
  lastTrainedAt: number | null,
  part: MusclePart,
  now: number = Date.now(),
): number | null {
  if (lastTrainedAt == null) return null;
  const elapsedHours = Math.max(0, (now - lastTrainedAt) / HOUR_MS);
  return Math.min(1, elapsedHours / RECOVERY_HOURS[part]);
}

/**
 * 回復までの残り時間(時間)を返す。回復済みなら0。未実施は0扱い。
 */
export function getRemainingHours(
  lastTrainedAt: number | null,
  part: MusclePart,
  now: number = Date.now(),
): number {
  if (lastTrainedAt == null) return 0;
  const elapsedHours = Math.max(0, (now - lastTrainedAt) / HOUR_MS);
  return Math.max(0, RECOVERY_HOURS[part] - elapsedHours);
}

export type RecoveryState = {
  label: string;
  color: string;
};

/**
 * 回復率から状態ラベルとカラーを返す。
 */
export function getRecoveryState(rate: number | null): RecoveryState {
  if (rate == null) return { label: '未実施', color: '#9AA0A6' };
  if (rate < 0.34) return { label: '疲労', color: '#E5484D' };
  if (rate < 0.75) return { label: '回復中', color: '#F5A524' };
  if (rate < 1) return { label: 'ほぼ回復', color: '#9BBF3B' };
  return { label: '回復済み', color: '#2FA84F' };
}

/**
 * 「今日おすすめの部位」を返す。
 * 回復率が RECOMMEND_THRESHOLD 以上の部位に加え、
 * まだ一度も鍛えていない部位（未実施）もトレーニング可能としておすすめに含める。
 * （⑤おすすめメニュー生成でも使う想定）
 */
export function getRecommendedParts(
  rates: Record<MusclePart, number | null>,
): MusclePart[] {
  return TRACKED_PARTS.filter((part) => {
    const rate = rates[part];
    return rate == null || rate >= RECOMMEND_THRESHOLD;
  });
}
