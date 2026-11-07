import {
  calculateWritingStreak,
  daysSinceFirstEntry,
  entriesWrittenToday,
} from '@/domain/streak';
import { DAY, makeEntry, NOW } from '../helpers/factories';

describe('calculateWritingStreak', () => {
  it('returns zero without entries', () => {
    expect(calculateWritingStreak([], NOW)).toBe(0);
  });

  it('counts consecutive days ending today', () => {
    const entries = [
      makeEntry({ id: 'today', createdAt: NOW }),
      makeEntry({ id: 'yesterday', createdAt: NOW - DAY }),
      makeEntry({ id: 'two-days', createdAt: NOW - DAY * 2 }),
    ];
    expect(calculateWritingStreak(entries, NOW)).toBe(3);
  });

  it('keeps a streak alive when the latest page was yesterday', () => {
    const entries = [
      makeEntry({ id: 'yesterday', createdAt: NOW - DAY }),
      makeEntry({ id: 'two-days', createdAt: NOW - DAY * 2 }),
    ];
    expect(calculateWritingStreak(entries, NOW)).toBe(2);
  });

  it('returns zero once a day has been missed', () => {
    const entries = [makeEntry({ id: 'old', createdAt: NOW - DAY * 2 })];
    expect(calculateWritingStreak(entries, NOW)).toBe(0);
  });

  it('does not count multiple pages on the same day twice', () => {
    const entries = [
      makeEntry({ id: 'morning', createdAt: NOW - 9 * 60 * 60 * 1000 }),
      makeEntry({ id: 'evening', createdAt: NOW - 60_000 }),
      makeEntry({ id: 'yesterday', createdAt: NOW - DAY }),
    ];
    expect(calculateWritingStreak(entries, NOW)).toBe(2);
  });
});

describe('daily helpers', () => {
  it('counts entries written today', () => {
    const entries = [
      makeEntry({ id: 'today', createdAt: NOW }),
      makeEntry({ id: 'yesterday', createdAt: NOW - DAY }),
    ];
    expect(entriesWrittenToday(entries, NOW)).toBe(1);
    expect(entriesWrittenToday([], NOW)).toBe(0);
  });

  it('measures days since the first entry', () => {
    const entries = [
      makeEntry({ id: 'first', createdAt: NOW - DAY * 10 }),
      makeEntry({ id: 'latest', createdAt: NOW }),
    ];
    expect(daysSinceFirstEntry(entries, NOW)).toBe(10);
    expect(daysSinceFirstEntry([], NOW)).toBe(0);
  });
});
