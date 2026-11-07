import { MAX_BOOKS, MAX_ENTRY_BODY_LENGTH, MAX_TAGS_PER_ENTRY } from '@/domain/constants';
import {
  appReducer,
  makeNewEntry,
  sanitizeEntry,
  type AppAction,
} from '@/domain/reducer';
import { makeBook, makeData, makeEntry, NOW } from '../helpers/factories';

describe('sanitizeEntry', () => {
  it('trims title/body limits, normalizes tags, and repairs dates', () => {
    const entry = sanitizeEntry(
      makeEntry({
        title: 'x'.repeat(500),
        body: 'y'.repeat(MAX_ENTRY_BODY_LENGTH + 20),
        tags: ['Gratitude', 'gratitude', ' self care ', '', 'work'],
        mood: 'unknown' as never,
        createdAt: Number.NaN,
        updatedAt: Number.NaN,
      }),
    );

    expect(entry.title).toHaveLength(120);
    expect(entry.body).toHaveLength(MAX_ENTRY_BODY_LENGTH);
    expect(entry.tags).toEqual(['gratitude', 'self-care', 'work']);
    expect(entry.mood).toBeNull();
    expect(Number.isFinite(entry.createdAt)).toBe(true);
    expect(Number.isFinite(entry.updatedAt)).toBe(true);
  });
});

describe('appReducer books', () => {
  it('creates a normalized book and makes it active', () => {
    const state = makeData({ entries: [] });
    const next = appReducer(state, {
      type: 'CREATE_BOOK',
      book: {
        ...makeBook({ isMain: false }),
        id: 'book_trip',
        title: '  Summer   trip ',
        icon: 'not-an-icon',
        color: 'not-a-colour',
      },
    });

    expect(next.books).toHaveLength(2);
    expect(next.books[1]).toMatchObject({
      id: 'book_trip',
      title: 'Summer trip',
      icon: '📖',
      color: '#C25E46',
      isMain: false,
    });
    expect(next.activeBookId).toBe('book_trip');
  });

  it('rejects duplicate names, blank names, extra books, and duplicate ids', () => {
    const state = makeData();
    const base = { ...makeBook({ isMain: false }), id: 'book_new' };

    expect(appReducer(state, { type: 'CREATE_BOOK', book: { ...base, title: 'my diary' } })).toBe(state);
    expect(appReducer(state, { type: 'CREATE_BOOK', book: { ...base, title: '   ' } })).toBe(state);
    expect(
      appReducer(state, { type: 'CREATE_BOOK', book: { ...base, id: 'book_main', title: 'Other' } }),
    ).toBe(state);
  });

  it('stops creating books at the limit', () => {
    const books = Array.from({ length: MAX_BOOKS }, (_, index) =>
      makeBook({
        id: index === 0 ? 'book_main' : `book_${index}`,
        title: index === 0 ? 'My Diary' : `Book ${index}`,
        isMain: index === 0,
      }),
    );
    const state = makeData({ books, entries: [] });
    const next = appReducer(state, {
      type: 'CREATE_BOOK',
      book: { ...makeBook({ isMain: false }), id: 'too_many', title: 'Too many' },
    });

    expect(next).toBe(state);
  });

  it('updates a book while protecting uniqueness and valid cover values', () => {
    const books = [
      makeBook(),
      makeBook({ id: 'book_trip', title: 'Trip', isMain: false, icon: '✈️' }),
    ];
    const state = makeData({ books, entries: [] });

    const renamed = appReducer(state, {
      type: 'UPDATE_BOOK',
      id: 'book_trip',
      changes: { title: '  Travel   notes ', icon: 'nope', color: 'nope' },
    });
    expect(renamed.books[1].title).toBe('Travel notes');
    expect(renamed.books[1].icon).toBe('✈️');
    expect(renamed.books[1].color).toBe('#C25E46');

    const duplicate = appReducer(state, {
      type: 'UPDATE_BOOK',
      id: 'book_trip',
      changes: { title: 'My Diary', icon: '📖', color: '#C25E46' },
    });
    expect(duplicate).toBe(state);
  });

  it('deletes a non-main book and its entries, falling back to the main diary', () => {
    const books = [
      makeBook(),
      makeBook({ id: 'book_trip', title: 'Trip', isMain: false }),
    ];
    const state = makeData({
      books,
      entries: [
        makeEntry({ id: 'entry_main', bookId: 'book_main' }),
        makeEntry({ id: 'entry_trip', bookId: 'book_trip' }),
      ],
      activeBookId: 'book_trip',
    });

    const next = appReducer(state, { type: 'DELETE_BOOK', id: 'book_trip' });

    expect(next.books.map((book) => book.id)).toEqual(['book_main']);
    expect(next.entries.map((entry) => entry.id)).toEqual(['entry_main']);
    expect(next.activeBookId).toBe('book_main');
  });

  it('never deletes the main diary or the last book', () => {
    const state = makeData({ entries: [] });
    expect(appReducer(state, { type: 'DELETE_BOOK', id: 'book_main' })).toBe(state);
  });

  it('only sets an active book that exists', () => {
    const state = makeData({ entries: [] });
    expect(appReducer(state, { type: 'SET_ACTIVE_BOOK', bookId: 'missing' })).toBe(state);
    expect(appReducer(state, { type: 'SET_ACTIVE_BOOK', bookId: 'book_main' })).toBe(state);
  });
});

describe('appReducer entries', () => {
  it('creates a non-blank entry and touches its book', () => {
    const state = makeData({ entries: [] });
    const entry = makeNewEntry('book_main', NOW);
    entry.title = 'A good day';

    const next = appReducer(state, { type: 'UPSERT_ENTRY', entry });

    expect(next.entries[0]).toMatchObject({ id: entry.id, title: 'A good day' });
    expect(next.books[0].updatedAt).toBe(entry.updatedAt);
  });

  it('refuses a brand new blank entry', () => {
    const state = makeData({ entries: [] });
    expect(appReducer(state, { type: 'UPSERT_ENTRY', entry: makeNewEntry('book_main') })).toBe(
      state,
    );
  });

  it('refuses entries for missing books', () => {
    const state = makeData({ entries: [] });
    const entry = { ...makeNewEntry('missing', NOW), title: 'Hello' };
    expect(appReducer(state, { type: 'UPSERT_ENTRY', entry })).toBe(state);
  });

  it('updates an existing entry in place and preserves its original createdAt', () => {
    const state = makeData({ entries: [makeEntry({ id: 'entry_1', createdAt: NOW - 1000 })] });
    const updated = makeEntry({
      id: 'entry_1',
      title: 'Changed',
      body: 'New body',
      createdAt: NOW + 500,
      updatedAt: NOW + 500,
    });

    const next = appReducer(state, { type: 'UPSERT_ENTRY', entry: updated });

    expect(next.entries).toHaveLength(1);
    expect(next.entries[0].title).toBe('Changed');
    expect(next.entries[0].createdAt).toBe(NOW - 1000);
    expect(next.entries[0].updatedAt).toBe(NOW + 500);
  });

  it('deletes entries and toggles favourites', () => {
    const state = makeData({
      entries: [
        makeEntry({ id: 'entry_1' }),
        makeEntry({ id: 'entry_2', favorite: false }),
      ],
    });

    const favourite = appReducer(state, { type: 'TOGGLE_FAVORITE', id: 'entry_2' });
    expect(favourite.entries[1].favorite).toBe(true);
    expect(appReducer(favourite, { type: 'TOGGLE_FAVORITE', id: 'missing' })).toBe(favourite);

    const deleted = appReducer(favourite, { type: 'DELETE_ENTRY', id: 'entry_1' });
    expect(deleted.entries.map((entry) => entry.id)).toEqual(['entry_2']);
  });

  it('limits and normalizes tags on upsert', () => {
    const state = makeData({ entries: [] });
    const tags = Array.from({ length: MAX_TAGS_PER_ENTRY + 3 }, (_, index) => `Tag ${index}`);
    const entry = { ...makeNewEntry('book_main', NOW), title: 'Hello', tags };

    const next = appReducer(state, { type: 'UPSERT_ENTRY', entry });
    expect(next.entries[0].tags).toHaveLength(MAX_TAGS_PER_ENTRY);
    expect(next.entries[0].tags[0]).toBe('tag-0');
  });
});

describe('appReducer settings and reset', () => {
  it('validates settings changes', () => {
    const state = makeData({ entries: [] });
    const next = appReducer(state, {
      type: 'UPDATE_SETTINGS',
      changes: {
        theme: 'dark',
        haptics: false,
        smartPunctuation: false,
        removeFillers: false,
        dictationLanguage: 'hi-IN',
      },
    });

    expect(next.settings).toMatchObject({
      theme: 'dark',
      haptics: false,
      smartPunctuation: false,
      removeFillers: false,
      dictationLanguage: 'hi-IN',
    });

    const invalid = appReducer(state, {
      type: 'UPDATE_SETTINGS',
      changes: { theme: 'neon' as never, dictationLanguage: 'xx-XX' },
    });
    expect(invalid.settings.theme).toBe('system');
    expect(invalid.settings.dictationLanguage).toBe('en-US');
  });

  it('hydrates and resets data', () => {
    const state = makeData({ entries: [] });
    const replacement = makeData({
      books: [makeBook({ id: 'book_other', title: 'Other' })],
      entries: [makeEntry({ bookId: 'book_other' })],
      activeBookId: 'book_other',
    });

    expect(appReducer(state, { type: 'HYDRATE', data: replacement })).toBe(replacement);
    expect(appReducer(state, { type: 'RESET_DATA', data: replacement })).toBe(replacement);
  });

  it('ignores unknown actions safely', () => {
    const state = makeData({ entries: [] });
    expect(appReducer(state, { type: 'NOPE' } as unknown as AppAction)).toBe(state);
  });
});
