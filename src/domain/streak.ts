import { localDateKey, dayDifference } from './date';
import type { Entry } from './types';

/**
 * Counts consecutive days with at least one entry. A streak is still alive if
 * the most recent entry was yesterday — it simply means today has not been
 * written yet.
 */
export function calculateWritingStreak(entries: readonly Entry[], now: number = Date.now()): number {
  if (entries.length === 0) return 0;

  const dayKeys = new Set(entries.map((entry) => localDateKey(entry.createdAt)));
  const today = new Date(now);
  const todayKey = localDateKey(today);
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  const yesterdayKey = localDateKey(yesterday);

  let cursor: Date;
  if (dayKeys.has(todayKey)) {
    cursor = today;
  } else if (dayKeys.has(yesterdayKey)) {
    cursor = yesterday;
  } else {
    return 0;
  }

  let streak = 0;
  while (dayKeys.has(localDateKey(cursor))) {
    streak += 1;
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() - 1);
  }
  return streak;
}

export function entriesWrittenToday(entries: readonly Entry[], now: number = Date.now()): number {
  const target = localDateKey(now);
  return entries.filter((entry) => localDateKey(entry.createdAt) === target).length;
}

export function daysSinceFirstEntry(entries: readonly Entry[], now: number = Date.now()): number {
  if (entries.length === 0) return 0;
  const earliest = entries.reduce(
    (minimum, entry) => Math.min(minimum, entry.createdAt),
    entries[0].createdAt,
  );
  return Math.max(0, dayDifference(now, earliest));
}
