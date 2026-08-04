import { RECOVERY_HOURS, TRACKED_PARTS } from '@/constants/recovery';
import type { Exercise, PartRecovery, RecoveryState, Session, TrackedPart } from '@/types';

/**
 * 回復率まわりの純粋関数。
 * 副作用ゼロ・引数だけで結果が決まるので、そのままユニットテストできる。
 */

const HOUR_MS = 60 * 60 * 1000;

function isTrackedPart(value: string): value is TrackedPart {
  return (TRACKED_PARTS as readonly string[]).includes(value);
}

/**
 * 部位ごとの「最後にトレーニングした時刻(ミリ秒)」を求める。
 * entry.exerciseId から exercises の category を引き、session.startedAt を採用する。
 * 一度もやっていない部位は null。
 */
export function getLastTrainedAtByPart(
  sessions: readonly Session[],
  exercises: readonly Exercise[],
): Record<TrackedPart, number | null> {
  const categoryById = new Map<string, string>();
  for (const exercise of exercises) {
    categoryById.set(exercise.id, exercise.category);
  }

  const result = {} as Record<TrackedPart, number | null>;
  for (const part of TRACKED_PARTS) {
    result[part] = null;
  }

  for (const session of sessions) {
    if (typeof session.startedAt !== 'number') continue;
    for (const entry of session.entries ?? []) {
      // セットが1つも無い entry は「実施した」とみなさない
      if (!entry.sets || entry.sets.length === 0) continue;
      const category = categoryById.get(entry.exerciseId);
      if (category === undefined || !isTrackedPart(category)) continue;

      const current = result[category];
      if (current === null || session.startedAt > current) {
        result[category] = session.startedAt;
      }
    }
  }

  return result;
}

/**
 * 回復率 0..1。last が null（未実施）なら null。
 * 経過時間 / RECOVERY_HOURS[part] を 0..1 にクランプする。
 */
export function getRecoveryRate(
  last: number | null,
  part: TrackedPart,
  now: number = Date.now(),
): number | null {
  if (last === null) return null;
  const elapsedHours = (now - last) / HOUR_MS;
  const rate = elapsedHours / RECOVERY_HOURS[part];
  return Math.min(1, Math.max(0, rate));
}

/** 完全回復まであと何時間か（すでに回復済みなら 0） */
export function getRemainingHours(
  last: number | null,
  part: TrackedPart,
  now: number = Date.now(),
): number {
  if (last === null) return 0;
  const elapsedHours = (now - last) / HOUR_MS;
  return Math.max(0, RECOVERY_HOURS[part] - elapsedHours);
}

/** 回復率 → 表示用の状態（ラベル・レベル・色） */
export function getRecoveryState(rate: number | null): RecoveryState {
  if (rate === null) return { label: '未実施', level: null, color: '#C7CAD1' };
  if (rate < 0.34) return { label: '疲労', level: 1, color: '#E5484D' };
  if (rate < 0.75) return { label: '回復中', level: 2, color: '#F5A524' };
  if (rate < 1) return { label: 'ほぼ回復', level: 3, color: '#9BBF3B' };
  return { label: '回復済み', level: 4, color: '#2FA84F' };
}

/** 画面で使いやすい形にまとめたビューモデルを、全 TRACKED_PARTS ぶん返す */
export function buildPartRecoveries(
  sessions: readonly Session[],
  exercises: readonly Exercise[],
  now: number = Date.now(),
): PartRecovery[] {
  const lastByPart = getLastTrainedAtByPart(sessions, exercises);

  return TRACKED_PARTS.map((part) => {
    const lastTrainedAt = lastByPart[part];
    const rate = getRecoveryRate(lastTrainedAt, part, now);
    return {
      part,
      lastTrainedAt,
      rate,
      remainingHours: getRemainingHours(lastTrainedAt, part, now),
      state: getRecoveryState(rate),
    };
  });
}
