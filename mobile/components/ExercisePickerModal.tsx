import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Chip from '@/components/Chip';
import EmptyState from '@/components/EmptyState';
import { CATEGORIES } from '@/constants/categories';
import { colors, fontSize, radius, spacing } from '@/constants/theme';
import type { Category, Exercise } from '@/types';

type Props = {
  visible: boolean;
  exercises: readonly Exercise[];
  /** すでに記録中の種目ID（リストで「追加済み」と出す） */
  usedExerciseIds?: readonly string[];
  onSelect: (exercise: Exercise) => void;
  onClose: () => void;
};

/** 種目を1つ選ぶモーダル。カテゴリ絞り込みと名前検索つき。 */
export function ExercisePickerModal({
  visible,
  exercises,
  usedExerciseIds = [],
  onSelect,
  onClose,
}: Props) {
  const [category, setCategory] = useState<Category | null>(null);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim();
    return exercises.filter((e) => {
      if (category !== null && e.category !== category) return false;
      if (q.length > 0 && !e.name.includes(q)) return false;
      return true;
    });
  }, [exercises, category, query]);

  const used = useMemo(() => new Set(usedExerciseIds), [usedExerciseIds]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <Text style={styles.title}>種目を選ぶ</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Text style={styles.close}>閉じる</Text>
          </Pressable>
        </View>

        <TextInput
          style={styles.search}
          value={query}
          onChangeText={setQuery}
          placeholder="種目名で検索"
          placeholderTextColor={colors.textFaint}
          returnKeyType="search"
        />

        <View style={styles.filters}>
          <Chip label="すべて" selected={category === null} onPress={() => setCategory(null)} />
          {CATEGORIES.map((c) => (
            <Chip
              key={c}
              label={c}
              selected={category === c}
              onPress={() => setCategory(category === c ? null : c)}
            />
          ))}
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={<EmptyState title="該当する種目がありません" />}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              onPress={() => onSelect(item)}
            >
              <View style={styles.rowMain}>
                <Text style={styles.rowName}>{item.name}</Text>
                <Text style={styles.rowCategory}>{item.category}</Text>
              </View>
              {used.has(item.id) && <Text style={styles.usedBadge}>追加済み</Text>}
            </Pressable>
          )}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
  },
  close: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.primary,
  },
  search: {
    marginHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    backgroundColor: colors.backgroundMuted,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowPressed: {
    opacity: 0.6,
  },
  rowMain: {
    flexShrink: 1,
  },
  rowName: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: '600',
  },
  rowCategory: {
    marginTop: 2,
    fontSize: fontSize.xs,
    color: colors.textFaint,
  },
  usedBadge: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.primary,
  },
});

export default ExercisePickerModal;
