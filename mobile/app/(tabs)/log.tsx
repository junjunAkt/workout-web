import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import Button from '@/components/Button';
import Card from '@/components/Card';
import EmptyState from '@/components/EmptyState';
import ExercisePickerModal from '@/components/ExercisePickerModal';
import Screen from '@/components/Screen';
import SessionEntryCard from '@/components/SessionEntryCard';
import { colors, fontSize, radius, spacing } from '@/constants/theme';
import useNow from '@/hooks/useNow';
import {
  createId,
  getActiveSession,
  getExercises,
  getSessions,
  setActiveSession,
  upsertSession,
} from '@/lib/storage';
import type { Exercise, Session, SetLog } from '@/types';
import { formatClock, formatTimer, toDateKey } from '@/utils/date';
import { countSets, findLastSetsForExercise } from '@/utils/session';

export default function LogScreen() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [active, setActive] = useState<Session | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // 計測中だけ1秒ごとに再描画する。表示する値は now - startedAt から計算するので、
  // バックグラウンドで setInterval が止まっても時間はズレない。
  const now = useNow(1000, active !== null);

  const reload = useCallback(async () => {
    const [nextExercises, nextSessions, nextActive] = await Promise.all([
      getExercises(),
      getSessions(),
      getActiveSession(),
    ]);
    setExercises(nextExercises);
    setSessions(nextSessions);
    setActive(nextActive);
    setLoaded(true);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const exerciseById = useMemo(() => {
    const map = new Map<string, Exercise>();
    for (const exercise of exercises) map.set(exercise.id, exercise);
    return map;
  }, [exercises]);

  /** 進行中セッションを更新して保存する */
  const updateActive = useCallback(async (next: Session) => {
    setActive(next);
    await setActiveSession(next);
  }, []);

  const startWorkout = useCallback(async () => {
    const startedAt = Date.now();
    const session: Session = {
      id: createId('session'),
      date: toDateKey(startedAt),
      startedAt,
      entries: [],
    };
    await updateActive(session);
  }, [updateActive]);

  /**
   * ワークアウトを終了して sessions に保存する。
   *
   * TODO: 開発ビルド後、HealthKitにsaveWorkout(startedAt, endedAt, 'strength training')
   */
  const finishWorkout = useCallback(async (session: Session) => {
    const endedAt = Date.now();
    const finished: Session = {
      ...session,
      endedAt,
      durationSec: Math.max(0, Math.floor((endedAt - session.startedAt) / 1000)),
      // セットが1つも無い種目は保存しない
      entries: session.entries.filter((e) => e.sets.length > 0),
    };

    const nextSessions = await upsertSession(finished);
    await setActiveSession(null);
    setSessions(nextSessions);
    setActive(null);
  }, []);

  const discardWorkout = useCallback(async () => {
    await setActiveSession(null);
    setActive(null);
  }, []);

  const confirmFinish = useCallback(() => {
    if (active === null) return;
    const totalSets = countSets(active);

    if (totalSets === 0) {
      Alert.alert(
        'ワークアウトを終了しますか？',
        'セットが1件も記録されていません。時間だけ保存することもできます。',
        [
          { text: 'キャンセル', style: 'cancel' },
          { text: '破棄する', style: 'destructive', onPress: () => void discardWorkout() },
          { text: '時間だけ保存', onPress: () => void finishWorkout(active) },
        ],
      );
      return;
    }

    Alert.alert('ワークアウトを終了しますか？', `${totalSets}セットを記録します。`, [
      { text: 'キャンセル', style: 'cancel' },
      { text: '終了する', onPress: () => void finishWorkout(active) },
    ]);
  }, [active, discardWorkout, finishWorkout]);

  const handleSelectExercise = useCallback(
    (exercise: Exercise) => {
      setPickerVisible(false);
      if (active === null) return;
      // 同じ種目は1セッションに1つ（セットはその中に足していく）
      if (active.entries.some((e) => e.exerciseId === exercise.id)) return;

      void updateActive({
        ...active,
        entries: [...active.entries, { exerciseId: exercise.id, sets: [] }],
      });
    },
    [active, updateActive],
  );

  const addSet = useCallback(
    (exerciseId: string, set: SetLog) => {
      if (active === null) return;
      void updateActive({
        ...active,
        entries: active.entries.map((e) =>
          e.exerciseId === exerciseId ? { ...e, sets: [...e.sets, set] } : e,
        ),
      });
    },
    [active, updateActive],
  );

  const removeSet = useCallback(
    (exerciseId: string, index: number) => {
      if (active === null) return;
      void updateActive({
        ...active,
        entries: active.entries.map((e) =>
          e.exerciseId === exerciseId ? { ...e, sets: e.sets.filter((_, i) => i !== index) } : e,
        ),
      });
    },
    [active, updateActive],
  );

  const removeEntry = useCallback(
    (exerciseId: string) => {
      if (active === null) return;
      void updateActive({
        ...active,
        entries: active.entries.filter((e) => e.exerciseId !== exerciseId),
      });
    },
    [active, updateActive],
  );

  const elapsedSec =
    active === null ? 0 : Math.max(0, Math.floor((now - active.startedAt) / 1000));

  return (
    <Screen title="記録" keyboardAvoiding>
      {/* ---- ワークアウトタイマー ---- */}
      <Card style={styles.timerCard}>
        {active === null ? (
          <>
            <Text style={styles.timerIdleText}>
              ワークアウトを開始すると時間の計測が始まります
            </Text>
            <Button
              label="ワークアウト開始"
              size="lg"
              onPress={() => void startWorkout()}
              style={styles.fullWidth}
            />
          </>
        ) : (
          <>
            <View style={styles.liveRow}>
              <View style={styles.liveDot} />
              <Text style={styles.liveLabel}>計測中</Text>
            </View>
            <Text style={styles.timer}>{formatTimer(elapsedSec)}</Text>
            <Text style={styles.timerMeta}>
              {formatClock(active.startedAt)} 開始・{countSets(active)}セット
            </Text>
            <Button
              label="ワークアウト終了"
              variant="danger"
              size="lg"
              onPress={confirmFinish}
              style={styles.fullWidth}
            />
          </>
        )}
      </Card>

      {/* ---- 種目ごとの記録 ---- */}
      {active !== null && (
        <View style={styles.entries}>
          {active.entries.length === 0 && (
            <EmptyState
              title="まだ種目がありません"
              description="「種目を追加」から今日やる種目を選んでください"
            />
          )}

          {active.entries.map((entry) => {
            const exercise = exerciseById.get(entry.exerciseId);
            if (exercise === undefined) return null;
            return (
              <SessionEntryCard
                key={entry.exerciseId}
                exercise={exercise}
                entry={entry}
                lastSets={findLastSetsForExercise(sessions, entry.exerciseId, active.id)}
                onAddSet={(set) => addSet(entry.exerciseId, set)}
                onRemoveSet={(index) => removeSet(entry.exerciseId, index)}
                onRemoveEntry={() => removeEntry(entry.exerciseId)}
              />
            );
          })}

          <Pressable
            onPress={() => setPickerVisible(true)}
            style={({ pressed }) => [styles.addExercise, pressed && styles.addExercisePressed]}
          >
            <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
            <Text style={styles.addExerciseText}>種目を追加</Text>
          </Pressable>
        </View>
      )}

      {loaded && active === null && (
        <EmptyState
          title="計測していません"
          description="「ワークアウト開始」を押すと種目とセットを記録できます"
        />
      )}

      <ExercisePickerModal
        visible={pickerVisible}
        exercises={exercises}
        usedExerciseIds={active?.entries.map((e) => e.exerciseId) ?? []}
        onSelect={handleSelectExercise}
        onClose={() => setPickerVisible(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  timerCard: {
    alignItems: 'center',
    gap: spacing.md,
  },
  timerIdleText: {
    fontSize: fontSize.sm,
    color: colors.textSub,
    textAlign: 'center',
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.danger,
  },
  liveLabel: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.danger,
  },
  timer: {
    fontSize: fontSize.display,
    fontWeight: '700',
    color: colors.text,
    fontVariant: ['tabular-nums'],
    letterSpacing: 1,
  },
  timerMeta: {
    fontSize: fontSize.sm,
    color: colors.textSub,
  },
  entries: {
    marginTop: spacing.lg,
  },
  addExercise: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
  },
  addExercisePressed: {
    opacity: 0.6,
  },
  addExerciseText: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.primary,
  },
});
