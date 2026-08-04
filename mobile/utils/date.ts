/** 日付・時間まわりの純粋関数 */

const pad2 = (n: number): string => String(n).padStart(2, '0');

/** ミリ秒 → 'YYYY-MM-DD'（端末のローカルタイム基準） */
export function toDateKey(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** 'YYYY-MM-DD' → その日の 00:00 の Date */
export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

export const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'] as const;

/** 'YYYY-MM-DD' → '8月4日(火)' */
export function formatDateJp(key: string): string {
  const d = fromDateKey(key);
  const weekday = WEEKDAY_LABELS[d.getDay()] ?? '';
  return `${d.getMonth() + 1}月${d.getDate()}日(${weekday})`;
}

/** ミリ秒 → 'HH:MM' */
export function formatClock(ms: number): string {
  const d = new Date(ms);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/**
 * 秒 → タイマー表示。
 * 1時間未満は 'MM:SS'、それ以上は 'H:MM:SS'。
 */
export function formatTimer(totalSec: number): string {
  const safe = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  return h > 0 ? `${h}:${pad2(m)}:${pad2(s)}` : `${pad2(m)}:${pad2(s)}`;
}

/** 秒 → '1時間23分' / '45分' / '30秒' のような日本語表記 */
export function formatDurationJp(totalSec: number): string {
  const safe = Math.max(0, Math.floor(totalSec));
  if (safe < 60) return `${safe}秒`;
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  if (h === 0) return `${m}分`;
  return m === 0 ? `${h}時間` : `${h}時間${m}分`;
}

/** その月の日数 */
export function daysInMonth(year: number, month0: number): number {
  return new Date(year, month0 + 1, 0).getDate();
}
