import { DEFAULT_SETTINGS } from '@/domain/defaults';
import { DATA_VERSION, type AppData, type Book, type Entry, type Settings } from '@/domain/types';

export const NOW = new Date(2026, 10, 6, 9, 30, 0).getTime();
export const DAY = 86_400_000;

export function makeBook(overrides: Partial<Book> = {}): Book {
  return {
    id: 'book_main',
    title: 'My Diary',
    icon: '📖',
    color: '#C25E46',
    isMain: true,
    createdAt: NOW - DAY * 30,
    updatedAt: NOW,
    ...overrides,
  };
}

export function makeEntry(overrides: Partial<Entry> = {}): Entry {
  return {
    id: 'entry_1',
    bookId: 'book_main',
    title: '',
    body: 'A quiet morning with coffee and rain.',
    mood: null,
    tags: [],
    favorite: false,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

export function makeData(overrides: Partial<AppData> = {}): AppData {
  const books = overrides.books ?? [makeBook()];
  const entries = overrides.entries ?? [makeEntry()];
  const settings: Settings = overrides.settings ?? { ...DEFAULT_SETTINGS };

  return {
    version: DATA_VERSION,
    activeBookId: overrides.activeBookId ?? books[0]?.id ?? 'book_main',
    books,
    entries,
    settings,
  };
}
