import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Body, { type ExtendedBodyPart } from 'react-native-body-highlighter';

import { MUSCLE_MAP } from '@/constants/muscleMap';
import { colors, fontSize, radius, spacing } from '@/constants/theme';
import type { PartRecovery } from '@/types';

type Side = 'front' | 'back';

type Props = {
  recoveries: readonly PartRecovery[];
  side: Side;
  onChangeSide: (side: Side) => void;
};

/** 未実施の部位に使う塗り（グレーのまま） */
const UNTRAINED_FILL = '#E4E8E6';

/**
 * 人体図。部位ごとの回復状態の色でハイライトする。
 * 色だけに頼らないよう、下の部位カードで％も併記している。
 */
export function BodyMap({ recoveries, side, onChangeSide }: Props) {
  const data = useMemo<ExtendedBodyPart[]>(() => {
    const parts: ExtendedBodyPart[] = [];
    for (const recovery of recoveries) {
      // 未実施（rate === null）は色を渡さず、defaultFill のグレーのままにする
      if (recovery.rate === null) continue;
      for (const slug of MUSCLE_MAP[recovery.part]) {
        parts.push({ slug, color: recovery.state.color });
      }
    }
    return parts;
  }, [recoveries]);

  return (
    <View style={styles.container}>
      <View style={styles.toggle}>
        {(['front', 'back'] as const).map((value) => {
          const selected = side === value;
          return (
            <Pressable
              key={value}
              onPress={() => onChangeSide(value)}
              style={[styles.toggleItem, selected && styles.toggleItemSelected]}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <Text style={[styles.toggleText, selected && styles.toggleTextSelected]}>
                {value === 'front' ? '前面' : '背面'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Body
        data={data}
        side={side}
        gender="male"
        scale={1.05}
        border={colors.border}
        defaultFill={UNTRAINED_FILL}
        defaultStroke={colors.border}
        defaultStrokeWidth={1}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundMuted,
    borderRadius: radius.pill,
    padding: 3,
  },
  toggleItem: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  toggleItemSelected: {
    backgroundColor: colors.primary,
  },
  toggleText: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.textSub,
  },
  toggleTextSelected: {
    color: colors.white,
  },
});

export default BodyMap;
