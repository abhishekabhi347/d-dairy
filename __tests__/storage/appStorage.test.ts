import { DEFAULT_SETTINGS } from '@/domain/defaults';
import { MAX_BOOKS, MAX_ENTRY_BODY_LENGTH } from '@/domain/constants';
import {
  clearAppData,
  deserializeAppData,
  LEGACY_STORAGE_KEY,
  loadAppData,
  parseAppData,
  saveAppData,
  serializeAppData,
  STORAGE_KEY,
  type StorageLike,
} from '@/storage/appStorage';
import { makeBook, makeData, makeEntry, NOW } from '../helpers/factories';

function memoryStorage(initial: Record<string, string> = {}): StorageLike & {
  values: Record<string, string>;
} {
  const values = { ...initial };
  return {
    values,
    getItem: jest.fn(async (key: string) => values[key] ?? null),
    setItem: jest.fn(async (key: string, value: string) => {
      values[key] = value;
    }),
    removeItem: jest.fn(async (key: string) => {
      delete values[key];
    }),
  };
}

describe('deserializeAppData', () => {
  it('rejects data without a usable book', () => {
    expect(deserializeAppData(null)).toBeNull();
    expect(deserializeAppData({})).toBeNull();
    expect(deserializeAppData({ books: [] })).toBeNull();
    expect(deserializeAppData({ books: [{ id: '', title: '' }] })).toBeNull();
  });

  it('repairs books, keeps one main diary, and drops duplicates', () => {
    const raw = {
      books: [
        { id: 'b1', title: '  My   diary ', color: '#C25E46', icon: '📖', isMain: true },
        { id: 'b1', title: 'Duplicate', isMain: true },
        { id: 'b2', title: 'Trip', color: 'green', icon: 'nope', isMain: true },
        { id: 'b3', title: 'Another', createdAt: NOW },
        { id: 'b4', title: '' },
      ],
      entries: [],
    };

    const data = deserializeAppData(raw, NOW)!;
    expect(data.books).toHaveLength(3);
    expect(data.books[0]).toMatchObject({ id: 'b1', title: 'My diary', isMain: true });
    expect(data.books[1]).toMatchObject({
      id: 'b2',
      title: 'Trip',
      color: '#C25E46',
      icon: '📖',
      isMain: false,
    });
    expect(data.books[2].createdAt).toBe(NOW);
    expect(data.books[2].updatedAt).toBe(NOW);
    expect(data.books.filter((book) => book.isMain)).toHaveLength(1);
  });

  it('promotes the first book when none is marked as main', () => {
    const data = deserializeAppData({
      books: [
        { id: 'b1', title: 'One', isMain: false },
        { id: 'b2', title: 'Two', isMain: false },
      ],
      entries: [],
    })!;

    expect(data.books[0].isMain).toBe(true);
    expect(data.books[1].isMain).toBe(false);
  });

  it('caps the number of books', () => {
    const books = Array.from({ length: MAX_BOOKS + 5 }, (_, index) => ({
      id: `b${index}`,
      title: `Book ${index}`,
      isMain: index === 0,
    }));
    expect(deserializeAppData({ books, entries: [] })!.books).toHaveLength(MAX_BOOKS);
  });

  it('drops orphaned, blank, and duplicate entries while sanitizing the rest', () => {
    const raw = {
      books: [{ id: 'b1', title: 'My Diary', isMain: true }],
      entries: [
        {
          id: 'e1',
          bookId: 'b1',
          title: 'Hi',
          body: 'Body',
          mood: 'great',
          tags: ['Gratitude', 'gratitude', 'self care', 42],
          favorite: true,
          createdAt: NOW,
          updatedAt: NOW,
        },
        { id: 'e1', bookId: 'b1', title: 'Duplicate', body: 'Body' },
        { id: 'e2', bookId: 'missing', title: 'Orphan', body: 'Body' },
        { id: 'e3', bookId: 'b1', title: '   ', body: '   ' },
        { id: 'e4', bookId: 'b1', title: '', body: 'x'.repeat(MAX_ENTRY_BODY_LENGTH + 10) },
      ],
    };

    const data = deserializeAppData(raw, NOW)!;
    expect(data.entries).toHaveLength(2);
    expect(data.entries[0]).toMatchObject({
      id: 'e1',
      mood: 'great',
      favorite: true,
      tags: ['gratitude', 'self-care'],
    });
    expect(data.entries[1].body).toHaveLength(MAX_ENTRY_BODY_LENGTH);
    expect(Number.isFinite(data.entries[1].createdAt)).toBe(true);
  });

  it('falls back to the main book for a missing active book', () => {
    const data = deserializeAppData(
      {
        books: [
          { id: 'b1', title: 'One', isMain: false },
          { id: 'b2', title: 'Two', isMain: true },
        ],
        entries: [],
        activeBookId: 'missing',
      },
      NOW,
    )!;
    expect(data.activeBookId).toBe('b2');
  });

  it('repairs malformed settings with defaults', () => {
    const data = deserializeAppData(
      {
        books: [{ id: 'b1', title: 'One', isMain: true }],
        entries: [],
        settings: {
          theme: 'neon',
          haptics: 'yes',
          smartPunctuation: false,
          dictationLanguage: 'xx-XX',
        },
      },
      NOW,
    )!;

    expect(data.settings).toEqual({
      ...DEFAULT_SETTINGS,
      smartPunctuation: false,
    });
  });

  it('always reports the current data version', () => {
    const data = deserializeAppData(
      { version: 999, books: [{ id: 'b1', title: 'One', isMain: true }], entries: [] },
      NOW,
    )!;
    expect(data.version).toBe(1);
  });
});

describe('serialization', () => {
  it('round-trips app data', () => {
    const data = makeData({
      books: [makeBook(), makeBook({ id: 'b2', title: 'Trip', isMain: false })],
      entries: [makeEntry({ id: 'e1' }), makeEntry({ id: 'e2', bookId: 'b2' })],
    });

    expect(parseAppData(serializeAppData(data), NOW)).toEqual(data);
  });

  it('returns null for empty or broken JSON', () => {
    expect(parseAppData(null)).toBeNull();
    expect(parseAppData('')).toBeNull();
    expect(parseAppData('{not json')).toBeNull();
    expect(parseAppData('42')).toBeNull();
  });
});

describe('loadAppData', () => {
  it('loads the current key first', async () => {
    const storage = memoryStorage({ [STORAGE_KEY]: serializeAppData(makeData()) });
    const loaded = await loadAppData(storage, NOW);
    expect(loaded?.entries[0].body).toContain('quiet morning');
    expect(storage.getItem).toHaveBeenCalledWith(STORAGE_KEY);
  });

  it('migrates from the legacy key when the current key is absent', async () => {
    const storage = memoryStorage({ [LEGACY_STORAGE_KEY]: serializeAppData(makeData()) });
    const loaded = await loadAppData(storage, NOW);
    expect(loaded?.books[0].title).toBe('My Diary');
  });

  it('falls back to the legacy key when the current value is corrupt', async () => {
    const storage = memoryStorage({
      [STORAGE_KEY]: 'garbage',
      [LEGACY_STORAGE_KEY]: serializeAppData(makeData()),
    });
    const loaded = await loadAppData(storage, NOW);
    expect(loaded?.books[0].title).toBe('My Diary');
  });

  it('returns null when nothing valid is stored', async () => {
    expect(await loadAppData(memoryStorage(), NOW)).toBeNull();
  });
});

describe('save and clear', () => {
  it('writes serialized data under the current key', async () => {
    const storage = memoryStorage();
    const data = makeData();
    await saveAppData(data, storage);
    expect(storage.setItem).toHaveBeenCalledWith(STORAGE_KEY, serializeAppData(data));
    expect(await loadAppData(storage, NOW)).toEqual(data);
  });

  it('removes both keys', async () => {
    const storage = memoryStorage({
      [STORAGE_KEY]: 'one',
      [LEGACY_STORAGE_KEY]: 'two',
    });
    await clearAppData(storage);
    expect(storage.values).toEqual({});
    expect(storage.removeItem).toHaveBeenCalledWith(STORAGE_KEY);
    expect(storage.removeItem).toHaveBeenCalledWith(LEGACY_STORAGE_KEY);
  });
});
