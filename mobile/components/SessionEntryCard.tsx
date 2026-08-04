import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import Card from '@/components/Card';
import { colors, fontSize, radius, spacing } from '@/constants/theme';
import type { Exercise, SessionEntry, SetLog } from '@/types';
import { formatDateJp } from '@/utils/date';

type Props = {
  exercise: Exercise;
  entry: SessionEntry;
  /** 前回この種目をやったときのセット内容（無ければ null） */
  lastSets: { sets: SetLog[]; date: string } | null;
  onAddSet: (set: SetLog) => void;
  onRemoveSet: (index: number) => void;
  onRemoveEntry: () => void;
};

/** 数値入力を安全にパースする。空文字や不正値は null。 */
function parseNumber(text: string): number | null {
  const trimmed = text.trim();
  if (trimmed.length === 0) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

/** 1種目ぶんの記録カード。セットの追加・削除と「前回データ呼び出し」を担当する。 */
export function SessionEntryCard({
  exercise,
  entry,
  lastSets,
  onAddSet,
  onRemoveSet,
  onRemoveEntry,
}: Props) {
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [rpe, setRpe] = useState('');

  // 前回の「同じ番号のセット」を参考値にする。足りなければ前回の最終セット。
  const reference: SetLog | null =
    lastSets === null || lastSets.sets.length === 0
      ? null
      : (lastSets.sets[entry.sets.length] ?? lastSets.sets[lastSets.sets.length - 1] ?? null);

  const applyReference = () => {
    if (reference === null) return;
    setWeight(String(reference.weight));
    setReps(String(reference.reps));
    setRpe(reference.rpe === undefined ? '' : String(reference.rpe));
  };

  const repsValue = parseNumber(reps);
  const weightValue = parseNumber(weight);
  const rpeValue = parseNumber(rpe);
  const canAdd = repsValue !== null && repsValue > 0;

  const handleAdd = () => {
    if (repsValue === null || repsValue <= 0) return;
    const set: SetLog = {
      weight: weightValue === null ? 0 : weightValue,
      reps: repsValue,
    };
    if (rpeValue !== null) set.rpe = rpeValue;

    onAddSet(set);
    // 次のセットは同じ重量で続けることが多いので、重量だけ残す
    setReps('');
    setRpe('');
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerTexts}>
          <Text style={styles.name}>{exercise.name}</Text>
          <Text style={styles.category}>{exercise.category}</Text>
        </View>
        <Pressable onPress={onRemoveEntry} hitSlop={8} accessibilityLabel="この種目を削除">
          <Ionicons name="close" size={20} color={colors.textFaint} />
        </Pressable>
      </View>

      {reference !== null && lastSets !== null && (
        <Pressable
          onPress={applyReference}
          style={({ pressed }) => [styles.lastHint, pressed && styles.lastHintPressed]}
          accessibilityLabel="前回の記録を入力欄にコピー"
        >
          <Ionicons name="return-down-forward" size={14} color={colors.textFaint} />
          <Text style={styles.lastHintText}>
            前回：{reference.weight}kg × {reference.reps}回
            {reference.rpe === undefined ? '' : ` RPE${reference.rpe}`}
          </Text>
          <Text style={styles.lastHintDate}>{formatDateJp(lastSets.date)}・タップで入力</Text>
        </Pressable>
      )}

      {entry.sets.length > 0 && (
        <View style={styles.setList}>
          {entry.sets.map((set, index) => (
            <View key={`${index}-${set.weight}-${set.reps}`} style={styles.setRow}>
              <Text style={styles.setIndex}>{index + 1}</Text>
              <Text style={styles.setText}>
                {set.weight}kg × {set.reps}回
                {set.rpe === undefined ? '' : `　RPE ${set.rpe}`}
              </Text>
              <Pressable
                onPress={() => onRemoveSet(index)}
                hitSlop={8}
                accessibilityLabel={`${index + 1}セット目を削除`}
              >
                <Ionicons name="trash-outline" size={16} color={colors.textFaint} />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <View style={styles.inputRow}>
        <View style={styles.inputBox}>
          <Text style={styles.inputLabel}>重量(kg)</Text>
          <TextInput
            style={styles.input}
            value={weight}
            onChangeText={setWeight}
            keyboardType="decimal-pad"
            placeholder={reference === null ? '0' : String(reference.weight)}
            placeholderTextColor={colors.textFaint}
          />
        </View>
        <View style={styles.inputBox}>
          <Text style={styles.inputLabel}>回数</Text>
          <TextInput
            style={styles.input}
            value={reps}
            onChangeText={setReps}
            keyboardType="number-pad"
            placeholder={reference === null ? '10' : String(reference.reps)}
            placeholderTextColor={colors.textFaint}
          />
        </View>
        <View style={styles.inputBox}>
          <Text style={styles.inputLabel}>RPE(任意)</Text>
          <TextInput
            style={styles.input}
            value={rpe}
            onChangeText={setRpe}
            keyboardType="decimal-pad"
            placeholder="-"
            placeholderTextColor={colors.textFaint}
          />
        </View>
      </View>

      <Pressable
        onPress={handleAdd}
        disabled={!canAdd}
        style={({ pressed }) => [
          styles.addButton,
          !canAdd && styles.addButtonDisabled,
          pressed && canAdd && styles.addButtonPressed,
        ]}
      >
        <Ionicons name="add" size={18} color={canAdd ? colors.primary : colors.textFaint} />
        <Text style={[styles.addButtonText, !canAdd && styles.addButtonTextDisabled]}>
          セットを追加
        </Text>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerTexts: {
    flexShrink: 1,
  },
  name: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  category: {
    marginTop: 2,
    fontSize: fontSize.xs,
    color: colors.textFaint,
  },
  lastHint: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
    backgroundColor: colors.backgroundMuted,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  lastHintPressed: {
    opacity: 0.6,
  },
  lastHintText: {
    fontSize: fontSize.sm,
    color: colors.textSub,
    fontWeight: '600',
  },
  lastHintDate: {
    fontSize: fontSize.xs,
    color: colors.textFaint,
  },
  setList: {
    gap: spacing.sm,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  setIndex: {
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    color: colors.primaryDark,
    fontSize: fontSize.xs,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 22,
  },
  setText: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  inputBox: {
    flex: 1,
  },
  inputLabel: {
    fontSize: fontSize.xs,
    color: colors.textSub,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: fontSize.md,
    color: colors.text,
    backgroundColor: colors.background,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
    paddingVertical: spacing.md,
  },
  addButtonPressed: {
    opacity: 0.7,
  },
  addButtonDisabled: {
    borderColor: colors.border,
    backgroundColor: colors.backgroundMuted,
  },
  addButtonText: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.primary,
  },
  addButtonTextDisabled: {
    color: colors.textFaint,
  },
});

export default SessionEntryCard;
