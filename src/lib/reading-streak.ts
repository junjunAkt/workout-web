import type { ReadingSession } from './reading-types';

export type StreakInfo = {
  currentStreak: number;
  maxStreak: number;
  readToday: boolean;
};

function toDateKey(epochMs: number): string {
  const d = new Date(epochMs);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function prevDay(dateKey: string): string {
  const d = new Date(dateKey + 'T00:00:00');
  d.setDate(d.getDate() - 1);
  return toDateKey(d.getTime());
}

export function getReadingDates(sessions: ReadingSession[]): Set<string> {
  const dates = new Set<string>();
  for (const s of sessions) {
    dates.add(toDateKey(s.startTime));
  }
  return dates;
}

export function calculateStreak(sessions: ReadingSession[]): StreakInfo {
  const dates = getReadingDates(sessions);
  if (dates.size === 0) {
    return { currentStreak: 0, maxStreak: 0, readToday: false };
  }

  const today = toDateKey(Date.now());
  const yesterday = prevDay(today);
  const readToday = dates.has(today);

  let current = 0;
  let cursor = readToday ? today : yesterday;
  while (dates.has(cursor)) {
    current++;
    cursor = prevDay(cursor);
  }

  const sorted = Array.from(dates).sort();
  let maxStreak = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (prevDay(sorted[i]) === sorted[i - 1]) {
      run++;
      if (run > maxStreak) maxStreak = run;
    } else {
      run = 1;
    }
  }

  return { currentStreak: current, maxStreak, readToday };
}

export type MonthlySummary = {
  year: number;
  month: number;
  totalTimeSec: number;
  totalPages: number;
  sessionCount: number;
  readingDays: number;
  dailyMinutes: number[];
  prevMonthTimeSec: number;
};

export function calculateMonthlySummary(
  sessions: ReadingSession[],
  year: number,
  month: number,
): MonthlySummary {
  const daysInMonth = new Date(year, month, 0).getDate();
  const dailyMinutes = new Array<number>(daysInMonth).fill(0);
  const readingDaySet = new Set<number>();

  let totalTimeSec = 0;
  let totalPages = 0;
  let sessionCount = 0;

  for (const s of sessions) {
    const d = new Date(s.startTime);
    if (d.getFullYear() === year && d.getMonth() + 1 === month) {
      totalTimeSec += s.durationSec;
      sessionCount++;
      const day = d.getDate();
      readingDaySet.add(day);
      dailyMinutes[day - 1] += Math.round(s.durationSec / 60);
      if (s.pageFrom != null && s.pageTo != null) {
        totalPages += s.pageTo - s.pageFrom + 1;
      }
    }
  }

  const prevYear = month === 1 ? year - 1 : year;
  const prevMonth = month === 1 ? 12 : month - 1;
  let prevMonthTimeSec = 0;
  for (const s of sessions) {
    const d = new Date(s.startTime);
    if (d.getFullYear() === prevYear && d.getMonth() + 1 === prevMonth) {
      prevMonthTimeSec += s.durationSec;
    }
  }

  return {
    year,
    month,
    totalTimeSec,
    totalPages,
    sessionCount,
    readingDays: readingDaySet.size,
    dailyMinutes,
    prevMonthTimeSec,
  };
}
