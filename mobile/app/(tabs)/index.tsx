import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import Button from '@/components/Button';
import Card, { SectionTitle } from '@/components/Card';
import Chip from '@/components/Chip';
import Screen from '@/components/Screen';
import { colors, fontSize, radius, spacing } from '@/constants/theme';
import useNow from '@/hooks/useNow';
import { getActiveSession, getExercises, getSessions } from '@/lib/storage';
import type { Exercise, Session } from '@/types';
import { formatDateJp, formatDurationJp, formatTimer, toDateKey } from '@/utils/date';
import { buildPartRecoveries } from '@/utils/recovery';
import { countExercises, countSets, getElapsedSec } from '@/utils/session';

export default function HomeScreen() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [active, setActive] = useState<Session | null>(null);

  // 進行中ワークアウトがあるときだけ秒更新。無いときは1分ごと（回復率の更新用）。
  const now = useNow(active === null ? 60 * 1000 : 1000, true);
  const todayKey = toDateKey(now);

  useFocusEffect(
    useCallback(() => {
      void Promise.all([getSessions(), getExercises(), getActiveSession()]).then(
        ([s, e, a]) => {
          setSessions(s);
          setExercises(e);
          setActive(a);
        },
      );
    }, []),
  );

  /** 今日ぶんのセッション（進行中があれば含める） */
  const todaySessions = useMemo(() => {
    const saved = sessions.filter((s) => s.date === todayKey);
    if (active !== null && active.date === todayKey) return [...saved, active];
    return saved;
  }, [sessions, active, todayKey]);

  const todayExerciseCount = todaySessions.reduce((sum, s) => sum + countExercises(s), 0);
  const todaySetCount = todaySessions.reduce((sum, s) => sum + countSets(s), 0);
  const todayTotalSec = todaySessions.reduce((sum, s) => sum + getElapsedSec(s, now), 0);

  const recoveredParts = useMemo(
    () =>
      buildPartRecoveries(sessions, exercises, now).filter(
        (r) => r.rate !== null && r.rate >= 1,
      ),
    [sessions, exercises, now],
  );

  const elapsedSec =
    active === null ? 0 : Math.max(0, Math.floor((now - active.startedAt) / 1000));

  return (
    <Screen title="ホーム" subtitle={formatDateJp(todayKey)}>
      {active !== null && (
        <Card style={styles.liveCard}>
          <View style={styles.liveRow}>
            <View style={styles.liveDot} />
            <Text style={styles.liveLabel}>ワークアウト計測中</Text>
          </View>
          <Text style={styles.liveTimer}>{formatTimer(elapsedSec)}</Text>
        </Card>
      )}

      <Card style={styles.statsCard}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{todayExerciseCount}</Text>
          <Text style={styles.statLabel}>種目</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{todaySetCount}</Text>
          <Text style={styles.statLabel}>総セット</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {todayTotalSec === 0 ? '0分' : formatDurationJp(todayTotalSec)}
          </Text>
          <Text style={styles.statLabel}>合計時間</Text>
        </View>
      </Card>

      <Button
        label={active === null ? 'トレーニングを記録' : '記録を続ける'}
        size="lg"
        onPress={() => router.push('/log')}
        style={styles.cta}
      />

      <SectionTitle>回復サマリー</SectionTitle>
      <Card>
        {recoveredParts.length === 0 ? (
          <Text style={styles.summaryEmpty}>回復済みの部位はまだありません</Text>
        ) : (
          <>
            <Text style={styles.summaryHint}>回復済みの部位</Text>
            <View style={styles.chips}>
              {recoveredParts.map((r) => (
                <Chip key={r.part} label={r.part} color={r.state.color} />
              ))}
            </View>
          </>
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  liveCard: {
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
    borderColor: colors.primary,
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
  liveTimer: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 32,
    backgroundColor: colors.border,
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textSub,
  },
  cta: {
    marginTop: spacing.lg,
  },
  summaryHint: {
    fontSize: fontSize.sm,
    color: colors.textSub,
    marginBottom: spacing.md,
  },
  summaryEmpty: {
    fontSize: fontSize.md,
    color: colors.textSub,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
