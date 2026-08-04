import type { Session, SetLog } from '@/types';

/** セッション集計まわりの純粋関数 */

/** そのセッションの「種目数」（セットが1つ以上ある entry のみ数える） */
export function countExercises(session: Session): number {
  return session.entries.filter((e) => e.sets.length > 0).length;
}

/** そのセッションの総セット数 */
export function countSets(session: Session): number {
  return session.entries.reduce((sum, e) => sum + e.sets.length, 0);
}

/**
 * セッションの経過秒数。
 * 終了済みなら durationSec（無ければ endedAt - startedAt）、
 * 進行中なら now - startedAt を使う。時刻の差分から出すので
 * バックグラウンド復帰でもズレない。
 */
export function getElapsedSec(session: Session, now: number = Date.now()): number {
  if (typeof session.durationSec === 'number') return Math.max(0, session.durationSec);
  const end = typeof session.endedAt === 'number' ? session.endedAt : now;
  return Math.max(0, Math.floor((end - session.startedAt) / 1000));
}

/** 複数セッションの合計時間（秒） */
export function sumDurationSec(sessions: readonly Session[], now: number = Date.now()): number {
  return sessions.reduce((sum, s) => sum + getElapsedSec(s, now), 0);
}

/** 'YYYY-MM-DD' → その日のセッション一覧 */
export function groupSessionsByDate(sessions: readonly Session[]): Map<string, Session[]> {
  const map = new Map<string, Session[]>();
  for (const session of sessions) {
    const list = map.get(session.date);
    if (list) {
      list.push(session);
    } else {
      map.set(session.date, [session]);
    }
  }
  return map;
}

/**
 * 指定した種目の「前回のセット内容」を探す。
 * startedAt の新しい順に走査し、最初に見つかった（セットが1つ以上ある）entry を返す。
 * excludeSessionId に進行中セッションのIDを渡すと、今回ぶんは無視できる。
 */
export function findLastSetsForExercise(
  sessions: readonly Session[],
  exerciseId: string,
  excludeSessionId?: string,
): { sets: SetLog[]; date: string } | null {
  const sorted = [...sessions].sort((a, b) => b.startedAt - a.startedAt);

  for (const session of sorted) {
    if (excludeSessionId !== undefined && session.id === excludeSessionId) continue;
    const entry = session.entries.find((e) => e.exerciseId === exerciseId && e.sets.length > 0);
    if (entry) return { sets: entry.sets, date: session.date };
  }
  return null;
}
