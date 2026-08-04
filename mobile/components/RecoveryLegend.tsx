import { StyleSheet, Text, View } from 'react-native';

import { colors, fontSize, radius, spacing } from '@/constants/theme';
import { getRecoveryState } from '@/utils/recovery';

/** 凡例に出す代表値（getRecoveryState と定義を二重管理しないよう rate から引く） */
const SAMPLE_RATES = [0, 0.5, 0.9, 1, null] as const;

export function RecoveryLegend() {
  return (
    <View style={styles.container}>
      {SAMPLE_RATES.map((rate) => {
        const state = getRecoveryState(rate);
        return (
          <View key={state.label} style={styles.item}>
            <View style={[styles.dot, { backgroundColor: state.color }]} />
            <Text style={styles.label}>{state.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.md,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: radius.pill,
  },
  label: {
    fontSize: fontSize.xs,
    color: colors.textSub,
  },
});

export default RecoveryLegend;
