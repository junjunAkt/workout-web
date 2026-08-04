import type { Category } from '@/types';

/** 表示順つきのカテゴリ一覧（フィルタや並び替えの基準） */
export const CATEGORIES: readonly Category[] = ['胸', '背中', '脚', '肩', '腕', '腹', '有酸素'];

/** 並び替え用のインデックス */
export function categoryOrder(category: Category): number {
  const index = CATEGORIES.indexOf(category);
  return index === -1 ? CATEGORIES.length : index;
}
