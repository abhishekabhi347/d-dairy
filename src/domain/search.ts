import type { Entry } from './types';
import { sortEntriesNewestFirst } from './entries';

export function normalizeForSearch(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function queryTokens(query: string): string[] {
  return normalizeForSearch(query).split(' ').filter(Boolean);
}

export function entrySearchText(entry: Entry): string {
  return normalizeForSearch(
    [entry.title, entry.body, entry.tags.map((tag) => tag.replace(/-/g, ' ')).join(' ')].join(' '),
  );
}

export function matchesQuery(entry: Entry, query: string): boolean {
  const tokens = queryTokens(query);
  if (tokens.length === 0) return true;
  const haystack = entrySearchText(entry);
  return tokens.every((token) => haystack.includes(token));
}

export function searchEntries(
  entries: readonly Entry[],
  options: { bookId?: string | null; query?: string; favoritesOnly?: boolean } = {},
): Entry[] {
  const query = options.query ?? '';
  return sortEntriesNewestFirst(
    entries.filter((entry) => {
      if (options.bookId && entry.bookId !== options.bookId) return false;
      if (options.favoritesOnly && !entry.favorite) return false;
      return matchesQuery(entry, query);
    }),
  );
}

export function groupEntriesByDay(
  entries: readonly Entry[],
  now: number = Date.now(),
): { key: string; timestamp: number; entries: Entry[] }[] {
  const sorted = sortEntriesNewestFirst(entries);
  const groups = new Map<string, { key: string; timestamp: number; entries: Entry[] }>();

  for (const entry of sorted) {
    const date = new Date(entry.createdAt);
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    const existing = groups.get(key);
    if (existing) {
      existing.entries.push(entry);
    } else {
      groups.set(key, { key, timestamp: entry.createdAt, entries: [entry] });
    }
  }

  return [...groups.values()].sort((a, b) => b.timestamp - a.timestamp);
}

export function relatedEntries(entries: readonly Entry[], current: Entry, limit = 3): Entry[] {
  const currentTags = new Set(current.tags);
  if (currentTags.size === 0) return [];

  return sortEntriesNewestFirst(
    entries.filter(
      (entry) =>
        entry.id !== current.id &&
        entry.bookId === current.bookId &&
        entry.tags.some((tag) => currentTags.has(tag)),
    ),
  ).slice(0, Math.max(0, limit));
}
