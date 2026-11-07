import {
  DEFAULT_SETTINGS,
  WELCOME_BODY,
  createEmptyData,
  createInitialData,
} from '@/domain/defaults';
import { DATA_VERSION } from '@/domain/types';
import { NOW } from '../helpers/factories';

describe('createInitialData', () => {
  const data = createInitialData(NOW);

  it('creates one main book and makes it active', () => {
    expect(data.books).toHaveLength(1);
    expect(data.books[0].isMain).toBe(true);
    expect(data.books[0].title).toBe('My Diary');
    expect(data.activeBookId).toBe(data.books[0].id);
  });

  it('starts with a warm welcome page', () => {
    expect(data.entries).toHaveLength(1);
    expect(data.entries[0].bookId).toBe(data.books[0].id);
    expect(data.entries[0].title).toBe('A little room for your days');
    expect(data.entries[0].body).toBe(WELCOME_BODY);
    expect(data.entries[0].mood).toBe('good');
    expect(data.entries[0].tags).toEqual(['reflection']);
  });

  it('uses the current data version and default settings', () => {
    expect(data.version).toBe(DATA_VERSION);
    expect(data.settings).toEqual(DEFAULT_SETTINGS);
    expect(data.settings).not.toBe(DEFAULT_SETTINGS);
  });
});

describe('createEmptyData', () => {
  it('keeps the main book but removes the welcome page', () => {
    const data = createEmptyData(NOW);
    expect(data.books).toHaveLength(1);
    expect(data.books[0].isMain).toBe(true);
    expect(data.entries).toEqual([]);
  });
});
