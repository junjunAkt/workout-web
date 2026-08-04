import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontSize, radius, spacing } from '@/constants/theme';
import { WEEKDAY_LABELS, daysInMonth, toDateKey } from '@/utils/date';

type Props = {
  /** 表示中の月（その月の1日を指す Date） */
  month: Date;
  /** 記録がある日付キー 'YYYY-MM-DD' */
  markedDates: ReadonlySet<string>;
  selectedDate: string | null;
  onSelectDate: (dateKey: string) => void;
  onChangeMonth: (next: Date) => void;
};

type Cell = { key: string; day: number } | null;

/** 月表示のカレンダー。記録がある日にドットを出す。 */
export function MonthCalendar({
  month,
  markedDates,
  selectedDate,
  onSelectDate,
  onChangeMonth,
}: Props) {
  const year = month.getFullYear();
  const month0 = month.getMonth();
  const todayKey = toDateKey(Date.now());

  const cells = useMemo<Cell[]>(() => {
    const firstWeekday = new Date(year, month0, 1).getDay();
    const total = daysInMonth(year, month0);
    const list: Cell[] = Array.from({ length: firstWeekday }, () => null);
    for (let day = 1; day <= total; day += 1) {
      list.push({ key: toDateKey(new Date(year, month0, day).getTime()), day });
    }
    // 最終週を7マスに揃える
    while (list.length % 7 !== 0) list.push(null);
    return list;
  }, [year, month0]);

  const shiftMonth = (diff: number) => onChangeMonth(new Date(year, month0 + diff, 1));

  return (
    <View>
      <View style={styles.header}>
        <Pressable onPress={() => shiftMonth(-1)} hitSlop={12} accessibilityLabel="前の月">
          <Ionicons name="chevron-back" size={22} color={colors.textSub} />
        </Pressable>
        <Text style={styles.monthLabel}>
          {year}年{month0 + 1}月
        </Text>
        <Pressable onPress={() => shiftMonth(1)} hitSlop={12} accessibilityLabel="次の月">
          <Ionicons name="chevron-forward" size={22} color={colors.textSub} />
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAY_LABELS.map((label) => (
          <Text key={label} style={styles.weekLabel}>
            {label}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((cell, index) => {
          if (cell === null) return <View key={`empty-${index}`} style={styles.cell} />;

          const selected = selectedDate === cell.key;
          const marked = markedDates.has(cell.key);
          const isToday = todayKey === cell.key;

          return (
            <Pressable
              key={cell.key}
              onPress={() => onSelectDate(cell.key)}
              style={styles.cell}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <View style={[styles.dayCircle, selected && styles.dayCircleSelected]}>
                <Text
                  style={[
                    styles.dayText,
                    isToday && styles.dayTextToday,
                    selected && styles.dayTextSelected,
                  ]}
                >
                  {cell.day}
                </Text>
              </View>
              <View
                style={[
                  styles.dot,
                  marked && styles.dotVisible,
                  marked && selected && styles.dotOnSelected,
                ]}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  monthLabel: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  weekRow: {
    flexDirection: 'row',
  },
  weekLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: fontSize.xs,
    color: colors.textFaint,
    marginBottom: spacing.xs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleSelected: {
    backgroundColor: colors.primary,
  },
  dayText: {
    fontSize: fontSize.sm,
    color: colors.text,
  },
  dayTextToday: {
    fontWeight: '700',
    color: colors.primaryDark,
  },
  dayTextSelected: {
    color: colors.white,
    fontWeight: '700',
  },
  dot: {
    width: 5,
    height: 5,
    marginTop: 2,
    borderRadius: radius.pill,
    backgroundColor: 'transparent',
  },
  dotVisible: {
    backgroundColor: colors.primary,
  },
  dotOnSelected: {
    backgroundColor: colors.primaryDark,
  },
});

export default MonthCalendar;
