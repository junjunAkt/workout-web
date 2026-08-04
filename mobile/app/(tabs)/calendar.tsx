import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import Card, { SectionTitle } from '@/components/Card';
import EmptyState from '@/components/EmptyState';
import MonthCalendar from '@/components/MonthCalendar';
import Screen from '@/components/Screen';
import { colors, fontSize, radius, spacing } from '@/constants/theme';
import { getExercises, getSessions } from '@/lib/storage';
import type { Exercise, Session } from '@/types';
import { formatClock, formatDateJp, formatDurationJp, toDateKey } from '@/utils/date';
import { countSets, getElapsedSec, groupSessionsByDate, sumDurationSec } from '@/utils/session';

export default function CalendarScreen() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string>(() => toDateKey(Date.now()));

  useFocusEffect(
    useCallback(() => {
      void Promise.all([getSessions(), getExercises()]).then(([s, e]) => {
        setSessions(s);
        setExercises(e);
      });
    }, []),
  );

  const byDate = useMemo(() => groupSessionsByDate(sessions), [sessions]);
  const markedDates = useMemo(() => new Set(byDate.keys()), [byDate]);

  const exerciseById = useMemo(() => {
    const map = new Map<string, Exercise>();
    for (const exercise of exercises) map.set(exercise.id, exercise);
    return map;
  }, [exercises]);

  const daySessions = byDate.get(selectedDate) ?? [];
  const dayTotalSec = sumDurationSec(daySessions);
  const dayTotalSets = daySessions.reduce((sum, s) => sum + countSets(s), 0);

  return (
    <Screen title="カレンダー">
      <Card>
        <MonthCalendar
          month={month}
          markedDates={markedDates}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onChangeMonth={setMonth}
        />
      </Card>

      <SectionTitle>{formatDateJp(selectedDate)}</SectionTitle>

      {daySessions.length === 0 ? (
        <Card>
          <EmptyState title="この日の記録はありません" />
        </Card>
      ) : (
        <>
          <Card style={styles.summary}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{formatDurationJp(dayTotalSec)}</Text>
              <Text style={styles.summaryLabel}>合計時間</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{dayTotalSets}</Text>
              <Text style={styles.summaryLabel}>総セット</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{daySessions.length}</Text>
              <Text style={styles.summaryLabel}>ワークアウト</Text>
            </View>
          </Card>

          {daySessions.map((session) => (
            <Card key={session.id} style={styles.sessionCard}>
              <Text style={styles.sessionTime}>
                {formatClock(session.startedAt)}
                {session.endedAt === undefined ? '' : ` - ${formatClock(session.endedAt)}`}
                　{formatDurationJp(getElapsedSec(session))}
              </Text>

              {session.entries.length === 0 ? (
                <Text style={styles.noEntry}>種目の記録はありません（時間のみ）</Text>
              ) : (
                session.entries.map((entry) => {
                  const exercise = exerciseById.get(entry.exerciseId);
                  return (
                    <View key={entry.exerciseId} style={styles.entry}>
                      <Text style={styles.entryName}>{exercise?.name ?? '（削除された種目）'}</Text>
                      <View style={styles.setChips}>
                        {entry.sets.map((set, index) => (
                          <Text key={`${index}-${set.weight}-${set.reps}`} style={styles.setChip}>
                            {set.weight}kg × {set.reps}
                            {set.rpe === undefined ? '' : ` @${set.rpe}`}
                          </Text>
                        ))}
                      </View>
                    </View>
                  );
                })
              )}
            </Card>
          ))}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingVertical: spacing.md,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  summaryDivider: {
    width: StyleSheet.hairlineWidth,
    height: 28,
    backgroundColor: colors.border,
  },
  summaryValue: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  summaryLabel: {
    fontSize: fontSize.xs,
    color: colors.textSub,
  },
  sessionCard: {
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  sessionTime: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  noEntry: {
    fontSize: fontSize.sm,
    color: colors.textFaint,
  },
  entry: {
    gap: spacing.xs,
  },
  entryName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  setChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  setChip: {
    fontSize: fontSize.xs,
    color: colors.textSub,
    backgroundColor: colors.backgroundMuted,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    overflow: 'hidden',
  },
});
