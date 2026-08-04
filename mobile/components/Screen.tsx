import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fontSize, spacing } from '@/constants/theme';

type Props = {
  title: string;
  subtitle?: string;
  /** 右上に置く要素（トグルなど） */
  headerRight?: ReactNode;
  /** true なら ScrollView で包まない（FlatList を直接置きたい画面用） */
  scroll?: boolean;
  /** キーボードで入力欄が隠れる画面（記録画面など）で true にする */
  keyboardAvoiding?: boolean;
  children: ReactNode;
};

/** 全画面共通の外枠。ヘッダーの見た目をここに集約する。 */
export function Screen({
  title,
  subtitle,
  headerRight,
  scroll = true,
  keyboardAvoiding = false,
  children,
}: Props) {
  const header = (
    <View style={styles.header}>
      <View style={styles.headerTexts}>
        <Text style={styles.title}>{title}</Text>
        {subtitle !== undefined && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {headerRight}
    </View>
  );

  const body = scroll ? (
    <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      {header}
      {children}
    </ScrollView>
  ) : (
    <View style={styles.plain}>
      {header}
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {keyboardAvoiding ? (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {body}
        </KeyboardAvoidingView>
      ) : (
        body
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.backgroundMuted,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  plain: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerTexts: {
    flexShrink: 1,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    marginTop: spacing.xs,
    fontSize: fontSize.sm,
    color: colors.textSub,
  },
});

export default Screen;
