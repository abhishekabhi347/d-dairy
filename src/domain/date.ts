const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

const MONTHS_SHORT = MONTHS.map((month) => month.slice(0, 3));

export function startOfDay(timestamp: number | Date): Date {
  const date = new Date(timestamp);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function localDateKey(timestamp: number | Date): string {
  const date = new Date(timestamp);
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function dayDifference(a: number | Date, b: number | Date): number {
  const first = startOfDay(a).getTime();
  const second = startOfDay(b).getTime();
  return Math.round((first - second) / 86_400_000);
}

export function formatHeaderDate(timestamp: number | Date = Date.now()): string {
  const date = new Date(timestamp);
  return `${WEEKDAYS[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

export function formatLongDate(timestamp: number | Date): string {
  const date = new Date(timestamp);
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatTime(timestamp: number | Date): string {
  const date = new Date(timestamp);
  const hours = date.getHours();
  const minutes = `${date.getMinutes()}`.padStart(2, '0');
  const suffix = hours >= 12 ? 'pm' : 'am';
  const hour = hours % 12 || 12;
  return `${hour}:${minutes} ${suffix}`;
}

export function formatEntryDay(timestamp: number | Date, now: number | Date = Date.now()): string {
  const difference = dayDifference(timestamp, now);
  if (difference === 0) return 'Today';
  if (difference === -1) return 'Yesterday';
  if (difference === 1) return 'Tomorrow';

  const date = new Date(timestamp);
  const nowDate = new Date(now);
  if (date.getFullYear() === nowDate.getFullYear()) {
    return `${WEEKDAYS[date.getDay()]}, ${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}`;
  }
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatRelativeUpdate(
  timestamp: number | Date,
  now: number | Date = Date.now(),
): string {
  const date = new Date(timestamp);
  const nowDate = new Date(now);
  const elapsed = Math.max(0, nowDate.getTime() - date.getTime());
  const difference = dayDifference(date, nowDate);

  if (difference === 0) {
    if (elapsed < 60_000) return 'Just now';
    if (elapsed < 3_600_000) return `${Math.floor(elapsed / 60_000)}m ago`;
    return `${Math.floor(elapsed / 3_600_000)}h ago`;
  }

  if (difference === -1) return 'Yesterday';
  if (difference < 0 && difference > -7) return `${-difference} days ago`;

  const includeYear = date.getFullYear() !== nowDate.getFullYear();
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}${
    includeYear ? ` ${date.getFullYear()}` : ''
  }`;
}

export function formatDuration(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${`${seconds}`.padStart(2, '0')}`;
}

export function greetingForHour(hour: number): string {
  if (hour < 5) return 'Still awake?';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Winding down';
}

export function shortWeekday(timestamp: number | Date): string {
  return WEEKDAYS[new Date(timestamp).getDay()];
}

function defaultPlural(singular: string): string {
  if (/[^aeiou]y$/i.test(singular)) return `${singular.slice(0, -1)}ies`;
  if (/(?:s|x|z|ch|sh)$/i.test(singular)) return `${singular}es`;
  return `${singular}s`;
}

export function formatCount(
  count: number,
  singular: string,
  plural = defaultPlural(singular),
): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
