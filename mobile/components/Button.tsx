import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { colors, fontSize, radius, spacing } from '@/constants/theme';

type Variant = 'primary' | 'secondary' | 'danger';
type Size = 'md' | 'lg';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  style,
}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        size === 'lg' && styles.lg,
        variantStyles[variant].container,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text
        style={[styles.label, size === 'lg' && styles.labelLg, variantStyles[variant].label]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const variantStyles: Record<Variant, { container: ViewStyle; label: { color: string } }> = {
  primary: {
    container: { backgroundColor: colors.primary, borderColor: colors.primary },
    label: { color: colors.white },
  },
  secondary: {
    container: { backgroundColor: colors.card, borderColor: colors.borderStrong },
    label: { color: colors.text },
  },
  danger: {
    container: { backgroundColor: colors.danger, borderColor: colors.danger },
    label: { color: colors.white },
  },
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  lg: {
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
  },
  pressed: {
    opacity: 0.75,
  },
  disabled: {
    opacity: 0.4,
  },
  label: {
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  labelLg: {
    fontSize: fontSize.lg,
  },
});

export default Button;
