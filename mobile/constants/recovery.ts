import type { TrackedPart } from '@/types';

/**
 * 部位ごとの完全回復までの想定時間（時間）。
 * 調整はここ1か所で完結させること。
 */
export const RECOVERY_HOURS: Record<TrackedPart, number> = {
  胸: 48,
  背中: 72,
  脚: 72,
  肩: 48,
  腕: 36,
  腹: 48,
};

/** 回復率を追跡する部位（有酸素は対象外） */
export const TRACKED_PARTS: readonly TrackedPart[] = ['胸', '背中', '脚', '肩', '腕', '腹'];

/** 「今日おすすめ」に出す回復率のしきい値 */
export const RECOMMEND_THRESHOLD = 0.75;

/** 回復画面の再計算間隔（ミリ秒） */
export const RECOVERY_REFRESH_MS = 60 * 1000;
