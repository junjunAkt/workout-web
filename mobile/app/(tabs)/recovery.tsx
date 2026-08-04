import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import BodyMap from '@/components/BodyMap';
import Card, { SectionTitle } from '@/components/Card';
import Chip from '@/components/Chip';
import PartRecoveryCard from '@/components/PartRecoveryCard';
import RecoveryLegend from '@/components/RecoveryLegend';
import Screen from '@/components/Screen';
import { RECOMMEND_THRESHOLD, RECOVERY_REFRESH_MS } from '@/constants/recovery';
import { colors, fontSize, spacing } from '@/constants/theme';
import useNow from '@/hooks/useNow';
import { getExercises, getSessions } from '@/lib/storage';
import type { Exercise, Session } from '@/types';
import { buildPartRecoveries } from '@/utils/recovery';

export default function RecoveryScreen() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [side, setSide] = useState<'front' | 'back'>('front');
  const [focused, setFocused] = useState(false);

  // 表示中だけ60秒ごとに再計算する（useNow が clearInterval まで面倒を見る）
  const now = useNow(RECOVERY_REFRESH_MS, focused);

  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      void Promise.all([getExercises(), getSessions()]).then(([nextExercises, nextSessions]) => {
        setExercises(nextExercises);
        setSessions(nextSessions);
      });
      return () => setFocused(false);
    }, []),
  );

  const recoveries = useMemo(
    () => buildPartRecoveries(sessions, exercises, now),
    [sessions, exercises, now],
  );

  const recommended = useMemo(
    () => recoveries.filter((r) => r.rate !== null && r.rate >= RECOMMEND_THRESHOLD),
    [recoveries],
  );

  return (
    <Screen title="回復" subtitle="部位別のリカバリー状況">
      <Card>
        <Text style={styles.recommendTitle}>今日おすすめの部位</Text>
        {recommended.length === 0 ? (
          <Text style={styles.restText}>
            {recoveries.every((r) => r.rate === null)
              ? 'まだ記録がありません。トレーニングを記録すると回復率が出ます'
              : '今日は休養日'}
          </Text>
        ) : (
          <View style={styles.chips}>
            {recommended.map((r) => (
              <Chip key={r.part} label={r.part} color={r.state.color} />
            ))}
          </View>
        )}
      </Card>

      <SectionTitle>人体図</SectionTitle>
      <Card>
        <BodyMap recoveries={recoveries} side={side} onChangeSide={setSide} />
        <View style={styles.legend}>
          <RecoveryLegend />
        </View>
      </Card>

      <SectionTitle>部位別</SectionTitle>
      {recoveries.map((recovery) => (
        <PartRecoveryCard key={recovery.part} recovery={recovery} />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  recommendTitle: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.textSub,
    marginBottom: spacing.md,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  restText: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  legend: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
