/**
 * デザイントークンはここに集約する。
 * 画面側で生の色コードを書かないこと（あとでダークモード等を足しやすくするため）。
 */

export const colors = {
  /** 画面の背景（白ベース） */
  background: '#FFFFFF',
  /** リスト画面などのうっすらグレー背景 */
  backgroundMuted: '#F6F8F7',
  card: '#FFFFFF',
  border: '#E5E8E6',
  borderStrong: '#D3D8D5',

  text: '#1B211D',
  textSub: '#6B7671',
  textFaint: '#A2ADA8',

  /** アクセント（落ち着いた緑） */
  primary: '#35855C',
  primaryDark: '#2A6C4A',
  /** アクセントの薄い背景 */
  primarySoft: '#E9F3ED',

  danger: '#E5484D',
  dangerSoft: '#FDECEC',
  warning: '#F5A524',

  white: '#FFFFFF',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 26,
  display: 48,
} as const;

/** 影は控えめ（iOS/Android 両方に効くように shadow と elevation を併記） */
export const shadow = {
  card: {
    shadowColor: '#0B1F14',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
} as const;

export const theme = { colors, spacing, radius, fontSize, shadow } as const;

export default theme;
