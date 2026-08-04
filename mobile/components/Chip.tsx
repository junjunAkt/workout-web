import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontSize, radius, spacing } from '@/constants/theme';

type Props = {
  label: string;
  selected?: boolean;
  /** 指定するとその色をアクセントに使う（回復状態チップなど） */
  color?: string;
  onPress?: () => void;
};

/** 丸いタグ。フィルタにも状態表示にも使う。 */
export function Chip({ label, selected = false, color, onPress }: Props) {
  const accent = color ?? colors.primary;
  const content = (
    <View
      style={[
        styles.chip,
        selected && { backgroundColor: accent, borderColor: accent },
        !selected && color !== undefined && { borderColor: accent },
      ]}
    >
      <Text
        style={[
          styles.label,
          selected && styles.labelSelected,
          !selected && color !== undefined && { color: accent },
        ]}
      >
        {label}
      </Text>
    </View>
  );

  if (onPress === undefined) return content;

  return (
    <Pressable onPress={onPress} hitSlop={4}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm - 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSub,
  },
  labelSelected: {
    color: colors.white,
  },
});

export default Chip;
