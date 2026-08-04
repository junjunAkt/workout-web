import { StyleSheet, Text, View } from 'react-native';

import Card from '@/components/Card';
import { colors, fontSize, radius, spacing } from '@/constants/theme';
import type { PartRecovery } from '@/types';

type Props = {
  recovery: PartRecovery;
};

/** 残り時間の文言。1時間未満は「まもなく回復」にする。 */
function remainingLabel(recovery: PartRecovery): string {
  if (recovery.lastTrainedAt === null) return 'まだ記録がありません';
  if (recovery.remainingHours <= 0) return '回復済み';
  if (recovery.remainingHours < 1) return 'あと1時間以内で回復';
  return `あと約${Math.ceil(recovery.remainingHours)}hで回復`;
}

/**
 * 部位カード：部位名 ＋ 状態ラベル(色付き) ＋ ％ ＋ 横バー ＋ 残り時間。
 * 色覚に配慮して、色だけでなく必ず％とラベルを併記する。
 */
export function PartRecoveryCard({ recovery }: Props) {
  const percent = recovery.rate === null ? null : Math.round(recovery.rate * 100);

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.part}>{recovery.part}</Text>
        <View style={styles.headerRight}>
          <Text style={[styles.stateLabel, { color: recovery.state.color }]}>
            {recovery.state.label}
          </Text>
          <Text style={styles.percent}>{percent === null ? '—' : `${percent}%`}</Text>
        </View>
      </View>

      <View style={styles.barTrack}>
        <View
          style={[
            styles.barFill,
            {
              width: `${percent ?? 0}%`,
              backgroundColor: recovery.state.color,
            },
          ]}
        />
      </View>

      <Text style={styles.remaining}>{remainingLabel(recovery)}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  part: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  stateLabel: {
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  percent: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
    fontVariant: ['tabular-nums'],
    minWidth: 44,
    textAlign: 'right',
  },
  barTrack: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.backgroundMuted,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: radius.pill,
  },
  remaining: {
    fontSize: fontSize.xs,
    color: colors.textSub,
  },
});

export default PartRecoveryCard;
