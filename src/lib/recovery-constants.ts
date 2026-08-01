/**
 * 回復トラッキングの定数
 * 回復時間を調整したいときはこのファイルの RECOVERY_HOURS だけ変えればよい。
 */

export type MusclePart = '胸' | '背中' | '脚' | '肩' | '腕' | '腹';

// 部位ごとの想定回復時間（時間）
export const RECOVERY_HOURS: Record<MusclePart, number> = {
  '胸': 48,
  '背中': 72,
  '脚': 72,
  '肩': 48,
  '腕': 36,
  '腹': 48,
};

export const TRACKED_PARTS: MusclePart[] = ['胸', '背中', '脚', '肩', '腕', '腹'];

// 記録には日付(YYYY-MM-DD)しかなく実施時刻が無いため、
// この時刻(ローカル時間)に実施したと仮定して経過時間を計算する。
export const ASSUMED_WORKOUT_HOUR = 12;

// 「今日おすすめの部位」に入れる回復率のしきい値
export const RECOMMEND_THRESHOLD = 0.75;
