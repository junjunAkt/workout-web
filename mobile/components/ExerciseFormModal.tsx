import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '@/components/Button';
import Chip from '@/components/Chip';
import { CATEGORIES } from '@/constants/categories';
import { colors, fontSize, radius, spacing } from '@/constants/theme';
import type { Category, Exercise } from '@/types';

type Props = {
  visible: boolean;
  /** null なら新規追加、Exercise なら編集 */
  target: Exercise | null;
  onSubmit: (values: {
    name: string;
    category: Category;
    videoUrl: string | null;
    memo: string | undefined;
  }) => void;
  onDelete?: () => void;
  onClose: () => void;
};

/** 種目の追加・編集フォーム。プリセットも videoUrl / memo を編集できる。 */
export function ExerciseFormModal({ visible, target, onSubmit, onDelete, onClose }: Props) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('胸');
  const [videoUrl, setVideoUrl] = useState('');
  const [memo, setMemo] = useState('');

  // モーダルを開くたびに対象の値へ初期化する
  useEffect(() => {
    if (!visible) return;
    setName(target?.name ?? '');
    setCategory(target?.category ?? '胸');
    setVideoUrl(target?.videoUrl ?? '');
    setMemo(target?.memo ?? '');
  }, [visible, target]);

  const isPreset = target?.isPreset === true;
  const canSubmit = name.trim().length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const trimmedUrl = videoUrl.trim();
    const trimmedMemo = memo.trim();
    onSubmit({
      name: name.trim(),
      category,
      videoUrl: trimmedUrl.length > 0 ? trimmedUrl : null,
      memo: trimmedMemo.length > 0 ? trimmedMemo : undefined,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.header}>
            <Text style={styles.title}>{target === null ? '種目を追加' : '種目を編集'}</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Text style={styles.close}>閉じる</Text>
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.label}>種目名</Text>
            <TextInput
              style={[styles.input, isPreset && styles.inputDisabled]}
              value={name}
              onChangeText={setName}
              editable={!isPreset}
              placeholder="例：インクラインダンベルプレス"
              placeholderTextColor={colors.textFaint}
            />
            {isPreset && <Text style={styles.hint}>プリセット種目の名前とカテゴリは変更できません</Text>}

            <Text style={styles.label}>カテゴリ</Text>
            <View style={styles.chips}>
              {CATEGORIES.map((c) => (
                <Chip
                  key={c}
                  label={c}
                  selected={category === c}
                  onPress={isPreset ? undefined : () => setCategory(c)}
                />
              ))}
            </View>

            <Text style={styles.label}>YouTube URL（任意）</Text>
            <TextInput
              style={styles.input}
              value={videoUrl}
              onChangeText={setVideoUrl}
              placeholder="https://www.youtube.com/watch?v=..."
              placeholderTextColor={colors.textFaint}
              autoCapitalize="none"
              keyboardType="url"
            />
            <Text style={styles.hint}>フォーム動画の再生は後の工程で対応予定です</Text>

            <Text style={styles.label}>メモ（任意）</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              value={memo}
              onChangeText={setMemo}
              placeholder="セッティングやコツなど"
              placeholderTextColor={colors.textFaint}
              multiline
            />

            <Button
              label={target === null ? '追加する' : '保存する'}
              onPress={handleSubmit}
              disabled={!canSubmit}
              size="lg"
              style={styles.submit}
            />

            {onDelete !== undefined && !isPreset && (
              <Pressable onPress={onDelete} style={styles.deleteButton}>
                <Text style={styles.deleteText}>この種目を削除</Text>
              </Pressable>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
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
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  label: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    backgroundColor: colors.background,
  },
  inputDisabled: {
    backgroundColor: colors.backgroundMuted,
    color: colors.textSub,
  },
  multiline: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  hint: {
    marginTop: spacing.xs,
    fontSize: fontSize.xs,
    color: colors.textFaint,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  submit: {
    marginTop: spacing.xl,
  },
  deleteButton: {
    marginTop: spacing.lg,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  deleteText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.danger,
  },
});

export default ExerciseFormModal;
