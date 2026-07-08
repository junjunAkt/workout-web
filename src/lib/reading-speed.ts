import type { ReadingSession } from './reading-types';

const OUTLIER_THRESHOLD = 3000;

export type SpeedInfo = {
  allTimeSpeed: number | null;
  recentSpeed: number | null;
  effectiveSpeed: number | null;
};

export type PredictionInfo = {
  remainingPages: number;
  estimatedHours: number;
  estimatedMinutes: number;
  lastPageRead: number;
};

function isValidSpeedSession(s: ReadingSession): boolean {
  return (
    s.pageFrom != null &&
    s.pageTo != null &&
    s.pageTo >= s.pageFrom &&
    s.durationSec > 0
  );
}

function sessionSpeed(s: ReadingSession): number {
  const pages = s.pageTo! - s.pageFrom! + 1;
  const hours = s.durationSec / 3600;
  return pages / hours;
}

export function calculateSpeedInfo(sessions: ReadingSession[]): SpeedInfo {
  const valid = sessions
    .filter(isValidSpeedSession)
    .filter((s) => sessionSpeed(s) <= OUTLIER_THRESHOLD);

  if (valid.length === 0) {
    return { allTimeSpeed: null, recentSpeed: null, effectiveSpeed: null };
  }

  const totalPages = valid.reduce(
    (sum, s) => sum + (s.pageTo! - s.pageFrom! + 1),
    0,
  );
  const totalHours = valid.reduce((sum, s) => sum + s.durationSec / 3600, 0);
  const allTimeSpeed = totalPages / totalHours;

  const sorted = [...valid].sort((a, b) => b.startTime - a.startTime);
  const recent = sorted.slice(0, 5);
  const recentPages = recent.reduce(
    (sum, s) => sum + (s.pageTo! - s.pageFrom! + 1),
    0,
  );
  const recentHours = recent.reduce((sum, s) => sum + s.durationSec / 3600, 0);
  const recentSpeed = recentPages / recentHours;

  const effectiveSpeed = valid.length >= 5 ? recentSpeed : allTimeSpeed;

  return {
    allTimeSpeed: Math.round(allTimeSpeed * 10) / 10,
    recentSpeed:
      valid.length >= 5 ? Math.round(recentSpeed * 10) / 10 : null,
    effectiveSpeed: Math.round(effectiveSpeed * 10) / 10,
  };
}

export function calculatePrediction(
  totalPages: number,
  sessions: ReadingSession[],
  speedInfo: SpeedInfo,
): PredictionInfo | null {
  if (!speedInfo.effectiveSpeed) return null;

  const maxPageTo = sessions.reduce((max, s) => {
    if (s.pageTo != null && s.pageTo > max) return s.pageTo;
    return max;
  }, 0);

  if (maxPageTo === 0 || maxPageTo >= totalPages) return null;

  const remainingPages = totalPages - maxPageTo;
  const remainingHours = remainingPages / speedInfo.effectiveSpeed;
  const totalMinutes = Math.round(remainingHours * 60);

  return {
    remainingPages,
    estimatedHours: Math.floor(totalMinutes / 60),
    estimatedMinutes: totalMinutes % 60,
    lastPageRead: maxPageTo,
  };
}
