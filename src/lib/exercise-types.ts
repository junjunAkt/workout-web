export type ExerciseCategory = '胸' | '背中' | '脚' | '肩' | '腕' | '腹' | '有酸素';

export type ExerciseMaster = {
  id: string;
  name: string;
  category: ExerciseCategory;
  videoUrl: string | null;
  isPreset: boolean;
  memo?: string;
};

export const CATEGORIES: ExerciseCategory[] = ['胸', '背中', '脚', '肩', '腕', '腹', '有酸素'];

export const CATEGORY_EMOJI: Record<ExerciseCategory, string> = {
  '胸': '🫁',
  '背中': '🔙',
  '脚': '🦵',
  '肩': '💪',
  '腕': '🤳',
  '腹': '🎯',
  '有酸素': '🏃',
};
