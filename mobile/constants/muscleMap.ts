import type { Slug } from 'react-native-body-highlighter';

import type { TrackedPart } from '@/types';

/**
 * 6カテゴリ → react-native-body-highlighter の slug。
 *
 * v3.2.0 の Slug 型に合わせて補正している（仕様書の名前とは一部異なる）:
 *   - 'front-deltoids' / 'back-deltoids' は存在せず 'deltoids' のみ（前面・背面の両方に描かれる）
 *   - 'adductor' ではなく 'adductors'
 *   - 'abductor' に相当する slug は無いため脚から除外し、代わりに 'tibialis'（前脛骨筋）を含めた
 */
export const MUSCLE_MAP: Record<TrackedPart, readonly Slug[]> = {
  胸: ['chest'],
  背中: ['trapezius', 'upper-back', 'lower-back'],
  肩: ['deltoids'],
  腕: ['biceps', 'triceps', 'forearm'],
  腹: ['abs', 'obliques'],
  脚: ['quadriceps', 'hamstring', 'calves', 'gluteal', 'adductors', 'tibialis'],
};

export default MUSCLE_MAP;
