import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Body, { type ExtendedBodyPart, type Slug } from 'react-native-body-highlighter';

import { ALL_BODY_SLUGS, MUSCLE_MAP } from '@/constants/muscleMap';
import { colors, fontSize, radius, spacing } from '@/constants/theme';
import type { PartRecovery } from '@/types';

type Side = 'front' | 'back';

type Props = {
  recoveries: readonly PartRecovery[];
  side: Side;
  onChangeSide: (side: Side) => void;
};

/** 未実施の部位に使う塗り（グレーのまま） */
const UNTRAINED_FILL = '#DFE4E1';

/** 筋肉の輪郭が潰れないよう、塗りより少し濃いグレーで縁取る */
const OUTLINE = '#B9C1BC';

/**
 * 人体図。部位ごとの回復状態の色でハイライトする。
 * 色だけに頼らないよう、下の部位カードで％も併記している。
 */
export function BodyMap({ recoveries, side, onChangeSide }: Props) {
  const data = useMemo<ExtendedBodyPart[]>(() => {
    // ライブラリのアセットは各部位に自前の色を持っているので、
    // まず全部位をグレーで塗りつぶしてから、実施済みの部位だけ上書きする。
    const colorBySlug = new Map<Slug, string>(
      ALL_BODY_SLUGS.map((slug) => [slug, UNTRAINED_FILL]),
    );

    for (const recovery of recoveries) {
      // 未実施（rate === null）はグレーのまま
      if (recovery.rate === null) continue;
      for (const slug of MUSCLE_MAP[recovery.part]) {
        colorBySlug.set(slug, recovery.state.color);
      }
    }

    return [...colorBySlug].map<ExtendedBodyPart>(([slug, color]) => ({ slug, color }));
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
        border={OUTLINE}
        defaultFill={UNTRAINED_FILL}
        defaultStroke={OUTLINE}
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
