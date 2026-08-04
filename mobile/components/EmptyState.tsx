import { StyleSheet, Text, View } from 'react-native';

import { colors, fontSize, spacing } from '@/constants/theme';

type Props = {
  title: string;
  description?: string;
};

/** 記録0件のときなどに出す控えめな空表示 */
export function EmptyState({ title, description }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {description !== undefined && <Text style={styles.description}>{description}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.xs,
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textSub,
  },
  description: {
    fontSize: fontSize.sm,
    color: colors.textFaint,
    textAlign: 'center',
  },
});

export default EmptyState;
