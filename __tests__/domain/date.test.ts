import {
  dayDifference,
  formatCount,
  formatDuration,
  formatEntryDay,
  formatHeaderDate,
  formatLongDate,
  formatRelativeUpdate,
  formatTime,
  greetingForHour,
  localDateKey,
  shortWeekday,
  startOfDay,
} from '@/domain/date';
import { DAY, NOW } from '../helpers/factories';

describe('calendar helpers', () => {
  it('starts the day at local midnight', () => {
    expect(startOfDay(NOW).getHours()).toBe(0);
    expect(startOfDay(NOW).getMinutes()).toBe(0);
  });

  it('creates a sortable local date key', () => {
    expect(localDateKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });

  it('measures whole-day differences', () => {
    expect(dayDifference(NOW, NOW - DAY)).toBe(1);
    expect(dayDifference(NOW, NOW)).toBe(0);
  });
});

describe('formatting', () => {
  it('formats header, long date, time, and count', () => {
    const date = new Date(2026, 10, 6, 15, 5);
    expect(formatHeaderDate(date)).toBe('Friday, 6 November');
    expect(formatLongDate(date)).toBe('6 November 2026');
    expect(formatTime(date)).toBe('3:05 pm');
    expect(formatTime(new Date(2026, 10, 6, 0, 7))).toBe('12:07 am');
    expect(formatCount(1, 'entry')).toBe('1 entry');
    expect(formatCount(2, 'entry')).toBe('2 entries');
    expect(formatCount(2, 'entry', 'pages')).toBe('2 pages');
  });

  it('names recent days in a friendly way', () => {
    const now = new Date(2026, 10, 6, 12);
    expect(formatEntryDay(now, now)).toBe('Today');
    expect(formatEntryDay(new Date(2026, 10, 5, 12), now)).toBe('Yesterday');
    expect(formatEntryDay(new Date(2026, 10, 7, 12), now)).toBe('Tomorrow');
    expect(formatEntryDay(new Date(2026, 10, 2, 12), now)).toBe('Monday, 2 Nov');
    expect(formatEntryDay(new Date(2025, 10, 2, 12), now)).toBe('2 Nov 2025');
  });

  it('describes relative updates', () => {
    expect(formatRelativeUpdate(NOW, NOW)).toBe('Just now');
    expect(formatRelativeUpdate(NOW - 90_000, NOW)).toBe('1m ago');
    expect(formatRelativeUpdate(NOW - 3_600_000, NOW)).toBe('1h ago');
    expect(formatRelativeUpdate(new Date(2026, 10, 5, 12), NOW)).toBe('Yesterday');
    expect(formatRelativeUpdate(new Date(2026, 10, 2, 12), NOW)).toBe('4 days ago');
    expect(formatRelativeUpdate(new Date(2025, 10, 2, 12), NOW)).toBe('2 Nov 2025');
  });

  it('formats dictation duration', () => {
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(61_000)).toBe('1:01');
    expect(formatDuration(-10)).toBe('0:00');
  });

  it('greets by hour and names weekdays', () => {
    expect(greetingForHour(2)).toBe('Still awake?');
    expect(greetingForHour(8)).toBe('Good morning');
    expect(greetingForHour(14)).toBe('Good afternoon');
    expect(greetingForHour(19)).toBe('Good evening');
    expect(greetingForHour(22)).toBe('Winding down');
    expect(shortWeekday(new Date(2026, 10, 6))).toBe('Friday');
  });
});
