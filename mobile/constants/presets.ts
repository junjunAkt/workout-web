import type { Category, Exercise } from '@/types';

/**
 * プリセット種目。
 * id は "preset_<英語スラッグ>" 固定。once 決めたら変えないこと
 * （過去 session の entry.exerciseId が id を参照しているため）。
 * videoUrl は後工程（YouTube 連携）で埋める想定。今は null。
 */
type PresetSeed = { slug: string; name: string };

const SEEDS: ReadonlyArray<readonly [Category, ReadonlyArray<PresetSeed>]> = [
  [
    '胸',
    [
      { slug: 'bench_press', name: 'ベンチプレス' },
      { slug: 'incline_bench_press', name: 'インクラインベンチプレス' },
      { slug: 'dumbbell_press', name: 'ダンベルプレス' },
      { slug: 'dumbbell_fly', name: 'ダンベルフライ' },
      { slug: 'chest_press_machine', name: 'チェストプレス（マシン）' },
      { slug: 'pec_fly', name: 'ペックフライ' },
      { slug: 'push_up', name: '腕立て伏せ' },
    ],
  ],
  [
    '背中',
    [
      { slug: 'deadlift', name: 'デッドリフト' },
      { slug: 'lat_pulldown', name: 'ラットプルダウン' },
      { slug: 'chin_up', name: '懸垂（チンニング）' },
      { slug: 'bent_over_row', name: 'ベントオーバーロウ' },
      { slug: 'seated_row', name: 'シーテッドロウ' },
      { slug: 'one_hand_row', name: 'ワンハンドロウ' },
    ],
  ],
  [
    '脚',
    [
      { slug: 'squat', name: 'スクワット' },
      { slug: 'leg_press', name: 'レッグプレス' },
      { slug: 'leg_extension', name: 'レッグエクステンション' },
      { slug: 'leg_curl', name: 'レッグカール' },
      { slug: 'bulgarian_squat', name: 'ブルガリアンスクワット' },
      { slug: 'calf_raise', name: 'カーフレイズ' },
      { slug: 'lunge', name: 'ランジ' },
    ],
  ],
  [
    '肩',
    [
      { slug: 'shoulder_press', name: 'ショルダープレス' },
      { slug: 'side_raise', name: 'サイドレイズ' },
      { slug: 'rear_raise', name: 'リアレイズ' },
      { slug: 'front_raise', name: 'フロントレイズ' },
      { slug: 'upright_row', name: 'アップライトロウ' },
    ],
  ],
  [
    '腕',
    [
      { slug: 'barbell_curl', name: 'バーベルカール' },
      { slug: 'dumbbell_curl', name: 'ダンベルカール' },
      { slug: 'hammer_curl', name: 'ハンマーカール' },
      { slug: 'triceps_pressdown', name: 'トライセプスプレスダウン' },
      { slug: 'skull_crusher', name: 'スカルクラッシャー' },
      { slug: 'dips', name: 'ディップス' },
    ],
  ],
  [
    '腹',
    [
      { slug: 'plank', name: 'プランク' },
      { slug: 'crunch', name: 'クランチ' },
      { slug: 'leg_raise', name: 'レッグレイズ' },
      { slug: 'ab_roller', name: 'アブローラー' },
      { slug: 'russian_twist', name: 'ロシアンツイスト' },
    ],
  ],
  [
    '有酸素',
    [
      { slug: 'treadmill', name: 'トレッドミル' },
      { slug: 'stationary_bike', name: 'エアロバイク' },
      { slug: 'rowing_machine', name: 'ローイングマシン' },
    ],
  ],
];

export const PRESET_EXERCISES: readonly Exercise[] = SEEDS.flatMap(([category, seeds]) =>
  seeds.map<Exercise>((seed) => ({
    id: `preset_${seed.slug}`,
    name: seed.name,
    category,
    videoUrl: null,
    isPreset: true,
  })),
);

export default PRESET_EXERCISES;
