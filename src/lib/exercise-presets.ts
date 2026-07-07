import type { ExerciseMaster, ExerciseCategory } from './exercise-types';

type PresetDef = { name: string; category: ExerciseCategory };

const presets: PresetDef[] = [
  // 胸
  { name: 'ベンチプレス', category: '胸' },
  { name: 'インクラインベンチプレス', category: '胸' },
  { name: 'ダンベルプレス', category: '胸' },
  { name: 'ダンベルフライ', category: '胸' },
  { name: 'チェストプレス（マシン）', category: '胸' },
  { name: 'ペックフライ', category: '胸' },
  { name: '腕立て伏せ', category: '胸' },
  // 背中
  { name: 'デッドリフト', category: '背中' },
  { name: 'ラットプルダウン', category: '背中' },
  { name: '懸垂（チンニング）', category: '背中' },
  { name: 'ベントオーバーロウ', category: '背中' },
  { name: 'シーテッドロウ', category: '背中' },
  { name: 'ワンハンドロウ', category: '背中' },
  // 脚
  { name: 'スクワット', category: '脚' },
  { name: 'レッグプレス', category: '脚' },
  { name: 'レッグエクステンション', category: '脚' },
  { name: 'レッグカール', category: '脚' },
  { name: 'ブルガリアンスクワット', category: '脚' },
  { name: 'カーフレイズ', category: '脚' },
  { name: 'ランジ', category: '脚' },
  // 肩
  { name: 'ショルダープレス', category: '肩' },
  { name: 'サイドレイズ', category: '肩' },
  { name: 'リアレイズ', category: '肩' },
  { name: 'フロントレイズ', category: '肩' },
  { name: 'アップライトロウ', category: '肩' },
  // 腕
  { name: 'バーベルカール', category: '腕' },
  { name: 'ダンベルカール', category: '腕' },
  { name: 'ハンマーカール', category: '腕' },
  { name: 'トライセプスプレスダウン', category: '腕' },
  { name: 'スカルクラッシャー', category: '腕' },
  { name: 'ディップス', category: '腕' },
  // 腹
  { name: 'プランク', category: '腹' },
  { name: 'クランチ', category: '腹' },
  { name: 'レッグレイズ', category: '腹' },
  { name: 'アブローラー', category: '腹' },
  { name: 'ロシアンツイスト', category: '腹' },
  // 有酸素
  { name: 'トレッドミル', category: '有酸素' },
  { name: 'エアロバイク', category: '有酸素' },
  { name: 'ローイングマシン', category: '有酸素' },
];

function toId(name: string): string {
  const map: Record<string, string> = {
    'ベンチプレス': 'bench_press',
    'インクラインベンチプレス': 'incline_bench_press',
    'ダンベルプレス': 'dumbbell_press',
    'ダンベルフライ': 'dumbbell_fly',
    'チェストプレス（マシン）': 'chest_press_machine',
    'ペックフライ': 'pec_fly',
    '腕立て伏せ': 'push_up',
    'デッドリフト': 'deadlift',
    'ラットプルダウン': 'lat_pulldown',
    '懸垂（チンニング）': 'chin_up',
    'ベントオーバーロウ': 'bent_over_row',
    'シーテッドロウ': 'seated_row',
    'ワンハンドロウ': 'one_hand_row',
    'スクワット': 'squat',
    'レッグプレス': 'leg_press',
    'レッグエクステンション': 'leg_extension',
    'レッグカール': 'leg_curl',
    'ブルガリアンスクワット': 'bulgarian_squat',
    'カーフレイズ': 'calf_raise',
    'ランジ': 'lunge',
    'ショルダープレス': 'shoulder_press',
    'サイドレイズ': 'side_raise',
    'リアレイズ': 'rear_raise',
    'フロントレイズ': 'front_raise',
    'アップライトロウ': 'upright_row',
    'バーベルカール': 'barbell_curl',
    'ダンベルカール': 'dumbbell_curl',
    'ハンマーカール': 'hammer_curl',
    'トライセプスプレスダウン': 'triceps_pressdown',
    'スカルクラッシャー': 'skull_crusher',
    'ディップス': 'dips',
    'プランク': 'plank',
    'クランチ': 'crunch',
    'レッグレイズ': 'leg_raise',
    'アブローラー': 'ab_roller',
    'ロシアンツイスト': 'russian_twist',
    'トレッドミル': 'treadmill',
    'エアロバイク': 'aero_bike',
    'ローイングマシン': 'rowing_machine',
  };
  return `preset_${map[name] ?? name}`;
}

export const PRESET_EXERCISES: ExerciseMaster[] = presets.map((p) => ({
  id: toId(p.name),
  name: p.name,
  category: p.category,
  videoUrl: null,
  isPreset: true,
}));
