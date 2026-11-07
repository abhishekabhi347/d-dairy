import { Platform, Share } from 'react-native';

import { buildMarkdownExport, exportJournal } from '@/utils/export';
import { makeBook, makeData, makeEntry, NOW } from '../helpers/factories';

const TRAVEL_BOOK = makeBook({
  id: 'book_travel',
  title: 'Coast Notes',
  isMain: false,
});

const EMPTY_BOOK = makeBook({
  id: 'book_empty',
  title: 'Future Pages',
  isMain: false,
});

const MAIN_ENTRY = makeEntry({
  id: 'entry_main',
  title: '',
  body: 'Rain on the window\nand a warm cup of tea.',
  mood: 'good',
  tags: ['mindfulness', 'self-care'],
  createdAt: NOW,
});

const TRAVEL_ENTRY = makeEntry({
  id: 'entry_travel',
  bookId: 'book_travel',
  title: 'Sea air',
  body: '  The tide came in slowly.  ',
  mood: null,
  tags: [],
  createdAt: NOW + 86_400_000,
});

const DATA = makeData({
  books: [makeBook(), TRAVEL_BOOK, EMPTY_BOOK],
  entries: [MAIN_ENTRY, TRAVEL_ENTRY],
});

describe('buildMarkdownExport', () => {
  const markdown = buildMarkdownExport(DATA, NOW);

  it('starts with a title and export date', () => {
    expect(markdown.startsWith('# d-dairy — my pages')).toBe(true);
    expect(markdown).toContain('_Exported 6 November 2026_');
  });

  it('lists the main diary first', () => {
    const mainIndex = markdown.indexOf('## Main diary · My Diary');
    const bookIndex = markdown.indexOf('## Book · Coast Notes');
    expect(mainIndex).toBeGreaterThan(-1);
    expect(mainIndex).toBeLessThan(bookIndex);
  });

  it('includes entry text, derived titles, mood, and labels', () => {
    expect(markdown).toContain('### Rain on the window');
    expect(markdown).toContain('Rain on the window\nand a warm cup of tea.');
    expect(markdown).toContain('Good');
    expect(markdown).toContain('Mindfulness, Self-care');
  });

  it('trims entry bodies and marks empty books', () => {
    expect(markdown).toContain('The tide came in slowly.');
    expect(markdown).toContain('## Book · Future Pages');
    expect(markdown).toContain('_No pages yet._');
  });

  it('ends with a gentle footer', () => {
    expect(markdown.trimEnd().endsWith('Made with d-dairy. A softer place for your days.')).toBe(
      true,
    );
  });
});

describe('exportJournal', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shares the markdown on native', async () => {
    const share = jest
      .spyOn(Share, 'share')
      .mockResolvedValue({ action: 'sharedAction', activityType: undefined });
    await expect(exportJournal(DATA)).resolves.toBe('shared');
    expect(share).toHaveBeenCalledWith({
      title: 'My d-dairy pages',
      message: expect.stringContaining('# d-dairy — my pages'),
    });
  });

  it('downloads a markdown file on web', async () => {
    const click = jest.fn();
    const createElement = jest.fn(() => ({ href: '', download: '', click }));
    const createObjectURL = jest.fn(() => 'blob:d-dairy');
    const revokeObjectURL = jest.fn();
    const originalDocument = (globalThis as { document?: unknown }).document;
    const originalUrl = globalThis.URL;

    jest.replaceProperty(Platform, 'OS', 'web');
    (globalThis as { document?: unknown }).document = { createElement };
    globalThis.URL = {
      ...originalUrl,
      createObjectURL,
      revokeObjectURL,
    } as unknown as typeof URL;

    try {
      await expect(exportJournal(DATA)).resolves.toBe('downloaded');
      expect(createElement).toHaveBeenCalledWith('a');
      expect(click).toHaveBeenCalledTimes(1);
      expect(createObjectURL).toHaveBeenCalledTimes(1);
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:d-dairy');
    } finally {
      (globalThis as { document?: unknown }).document = originalDocument;
      globalThis.URL = originalUrl;
    }
  });
});
