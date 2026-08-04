import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import Chip from '@/components/Chip';
import EmptyState from '@/components/EmptyState';
import ExerciseFormModal from '@/components/ExerciseFormModal';
import Screen from '@/components/Screen';
import { CATEGORIES, categoryOrder } from '@/constants/categories';
import { colors, fontSize, radius, shadow, spacing } from '@/constants/theme';
import { createId, deleteExercise, getExercises, upsertExercise } from '@/lib/storage';
import type { Category, Exercise } from '@/types';

export default function ExercisesScreen() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [editing, setEditing] = useState<Exercise | null>(null);

  const reload = useCallback(async () => {
    setExercises(await getExercises());
  }, []);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const filtered = useMemo(() => {
    const list = category === null ? exercises : exercises.filter((e) => e.category === category);
    return [...list].sort((a, b) => {
      const byCategory = categoryOrder(a.category) - categoryOrder(b.category);
      if (byCategory !== 0) return byCategory;
      // 自作種目を先に出す
      if (a.isPreset !== b.isPreset) return a.isPreset ? 1 : -1;
      return a.name.localeCompare(b.name, 'ja');
    });
  }, [exercises, category]);

  const openNew = () => {
    setEditing(null);
    setFormVisible(true);
  };

  const openEdit = (exercise: Exercise) => {
    setEditing(exercise);
    setFormVisible(true);
  };

  const handleSubmit = useCallback(
    async (values: {
      name: string;
      category: Category;
      videoUrl: string | null;
      memo: string | undefined;
    }) => {
      const next: Exercise =
        editing === null
          ? {
              id: createId('ex'),
              name: values.name,
              category: values.category,
              videoUrl: values.videoUrl,
              isPreset: false,
              ...(values.memo === undefined ? {} : { memo: values.memo }),
            }
          : {
              ...editing,
              // プリセットは名前とカテゴリを変えない
              name: editing.isPreset ? editing.name : values.name,
              category: editing.isPreset ? editing.category : values.category,
              videoUrl: values.videoUrl,
              ...(values.memo === undefined ? { memo: undefined } : { memo: values.memo }),
            };

      setExercises(await upsertExercise(next));
      setFormVisible(false);
      setEditing(null);
    },
    [editing],
  );

  const handleDelete = useCallback(() => {
    if (editing === null || editing.isPreset) return;
    const target = editing;
    Alert.alert('種目を削除しますか？', `「${target.name}」を削除します。`, [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除',
        style: 'destructive',
        onPress: () => {
          void deleteExercise(target.id).then((next) => {
            setExercises(next);
            setFormVisible(false);
            setEditing(null);
          });
        },
      },
    ]);
  }, [editing]);

  return (
    <Screen
      title="種目"
      subtitle={`${exercises.length}種目（プリセット＋自作）`}
      scroll={false}
      headerRight={
        <Pressable
          onPress={openNew}
          style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
          accessibilityLabel="種目を追加"
        >
          <Ionicons name="add" size={22} color={colors.white} />
        </Pressable>
      }
    >
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
        ListEmptyComponent={<EmptyState title="種目がありません" />}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => openEdit(item)}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
          >
            <View style={styles.rowMain}>
              <View style={styles.rowTitleLine}>
                <Text style={styles.rowName}>{item.name}</Text>
                {!item.isPreset && <Text style={styles.customBadge}>自作</Text>}
              </View>
              <Text style={styles.rowMeta}>
                {item.category}
                {item.videoUrl !== null ? '・動画あり' : ''}
              </Text>
              {item.memo !== undefined && item.memo.length > 0 && (
                <Text style={styles.rowMemo} numberOfLines={1}>
                  {item.memo}
                </Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
          </Pressable>
        )}
      />

      <ExerciseFormModal
        visible={formVisible}
        target={editing}
        onSubmit={(values) => void handleSubmit(values)}
        onDelete={editing === null ? undefined : handleDelete}
        onClose={() => {
          setFormVisible(false);
          setEditing(null);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  addButton: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  pressed: {
    opacity: 0.6,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.card,
  },
  rowMain: {
    flexShrink: 1,
  },
  rowTitleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rowName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  customBadge: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.primaryDark,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 1,
    overflow: 'hidden',
  },
  rowMeta: {
    marginTop: 2,
    fontSize: fontSize.xs,
    color: colors.textFaint,
  },
  rowMemo: {
    marginTop: 2,
    fontSize: fontSize.xs,
    color: colors.textSub,
  },
});
