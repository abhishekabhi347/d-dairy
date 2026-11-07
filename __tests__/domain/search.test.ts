import {
  entrySearchText,
  groupEntriesByDay,
  matchesQuery,
  normalizeForSearch,
  queryTokens,
  relatedEntries,
  searchEntries,
} from '@/domain/search';
import { makeEntry, NOW, DAY } from '../helpers/factories';

describe('normalization', () => {
  it('lowercases, strips accents, and collapses whitespace', () => {
    expect(normalizeForSearch('  Café   au Lait ')).toBe('cafe au lait');
    expect(normalizeForSearch('Crème Brûlée')).toBe('creme brulee');
  });

  it('splits a query into meaningful tokens', () => {
    expect(queryTokens('  Rainy   Café  ')).toEqual(['rainy', 'cafe']);
    expect(queryTokens('   ')).toEqual([]);
  });

  it('searches titles, bodies, and humanized tags', () => {
    const entry = makeEntry({
      title: 'Sunday',
      body: 'A slow morning',
      tags: ['self-care', 'quiet-time'],
    });
    expect(entrySearchText(entry)).toContain('sunday');
    expect(entrySearchText(entry)).toContain('self care');
    expect(entrySearchText(entry)).toContain('quiet time');
  });
});

describe('matchesQuery', () => {
  const entry = makeEntry({
    title: 'A café morning',
    body: 'Rain on the window and a warm cup of tea.',
    tags: ['mindfulness'],
  });

  it('matches every token across fields', () => {
    expect(matchesQuery(entry, 'cafe tea')).toBe(true);
    expect(matchesQuery(entry, 'MORNING mindfulness')).toBe(true);
  });

  it('treats an empty query as a match', () => {
    expect(matchesQuery(entry, '   ')).toBe(true);
  });

  it('rejects missing tokens', () => {
    expect(matchesQuery(entry, 'cafe beach')).toBe(false);
  });
});

describe('searchEntries', () => {
  const entries = [
    makeEntry({ id: 'a', bookId: 'main', updatedAt: NOW, favorite: true, body: 'grateful' }),
    makeEntry({
      id: 'b',
      bookId: 'main',
      updatedAt: NOW - DAY,
      favorite: false,
      body: 'a hard day',
    }),
    makeEntry({
      id: 'c',
      bookId: 'travel',
      updatedAt: NOW - DAY * 2,
      favorite: true,
      body: 'grateful for the sea',
    }),
  ];

  it('filters by book, favorites, and query while keeping newest first', () => {
    expect(searchEntries(entries, { bookId: 'main' }).map((entry) => entry.id)).toEqual([
      'a',
      'b',
    ]);
    expect(searchEntries(entries, { favoritesOnly: true }).map((entry) => entry.id)).toEqual([
      'a',
      'c',
    ]);
    expect(searchEntries(entries, { query: 'grateful' }).map((entry) => entry.id)).toEqual([
      'a',
      'c',
    ]);
  });

  it('returns everything for an empty query', () => {
    expect(searchEntries(entries).map((entry) => entry.id)).toEqual(['a', 'b', 'c']);
  });
});

describe('groupEntriesByDay', () => {
  it('groups entries by local day and orders groups newest first', () => {
    const entries = [
      makeEntry({ id: 'older', createdAt: NOW - DAY, updatedAt: NOW - DAY }),
      makeEntry({ id: 'newer-a', createdAt: NOW, updatedAt: NOW }),
      makeEntry({ id: 'newer-b', createdAt: NOW - 60_000, updatedAt: NOW - 60_000 }),
    ];

    const groups = groupEntriesByDay(entries, NOW);
    expect(groups).toHaveLength(2);
    expect(groups[0].entries.map((entry) => entry.id)).toEqual(['newer-a', 'newer-b']);
    expect(groups[1].entries.map((entry) => entry.id)).toEqual(['older']);
  });
});

describe('relatedEntries', () => {
  it('finds recent entries in the same book that share a tag', () => {
    const current = makeEntry({ id: 'current', tags: ['travel', 'wins'], bookId: 'main' });
    const entries = [
      current,
      makeEntry({
        id: 'shared-new',
        tags: ['wins'],
        bookId: 'main',
        updatedAt: NOW - DAY,
      }),
      makeEntry({
        id: 'shared-old',
        tags: ['travel'],
        bookId: 'main',
        updatedAt: NOW - DAY * 2,
      }),
      makeEntry({ id: 'other-book', tags: ['wins'], bookId: 'travel', updatedAt: NOW }),
      makeEntry({ id: 'no-shared', tags: ['work'], bookId: 'main', updatedAt: NOW }),
    ];

    expect(relatedEntries(entries, current).map((entry) => entry.id)).toEqual([
      'shared-new',
      'shared-old',
    ]);
    expect(relatedEntries(entries, current, 1).map((entry) => entry.id)).toEqual(['shared-new']);
    expect(relatedEntries(entries, current, 0)).toEqual([]);
  });

  it('returns nothing when the current entry has no tags', () => {
    const current = makeEntry({ id: 'current', tags: [] });
    expect(relatedEntries([current], current)).toEqual([]);
  });
});
