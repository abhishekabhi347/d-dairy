import {
  bookEntryCounts,
  countWords,
  deriveTitle,
  displayTitle,
  entryExcerpt,
  hasEntryContent,
  normalizeTag,
  sanitizeEntryDraft,
  sortEntriesNewestFirst,
  stripMarkdown,
  tagLabel,
  toggleTag,
  uniqueTags,
} from '@/domain/entries';
import { makeEntry, NOW } from '../helpers/factories';

describe('countWords', () => {
  it('counts latin words', () => {
    expect(countWords('One small thought.')).toBe(3);
    expect(countWords('   ')).toBe(0);
  });

  it('counts CJK characters and surrounding words', () => {
    expect(countWords('今天很好')).toBe(4);
    expect(countWords('hello 世界')).toBe(3);
  });
});

describe('markdown helpers', () => {
  it('strips common markdown', () => {
    expect(stripMarkdown('## Heading\n**bold** and [a link](https://example.com)')).toBe(
      'Heading\nbold and a link',
    );
  });

  it('derives a title from the first non-empty line', () => {
    expect(deriveTitle('\n\n# A day at the sea\nMore words')).toBe('A day at the sea');
    expect(deriveTitle('   ')).toBe('Untitled entry');
  });

  it('truncates very long titles at a word boundary', () => {
    const title = deriveTitle('one two three four five six seven eight nine ten eleven twelve thirteen');
    expect(title.endsWith('…')).toBe(true);
    expect(title.length).toBeLessThanOrEqual(61);
  });

  it('prefers an explicit title and falls back to the body', () => {
    expect(displayTitle({ title: '  **Hello** ', body: 'ignored' })).toBe('Hello');
    expect(displayTitle({ title: '', body: 'First line\nSecond' })).toBe('First line');
  });

  it('creates a readable excerpt', () => {
    expect(entryExcerpt('', 10)).toBe('No words yet — just a quiet page.');
    expect(entryExcerpt('one two three four five', 10)).toBe('one two…');
  });
});

describe('tags', () => {
  it('normalizes spaces, punctuation, and case', () => {
    expect(normalizeTag('  Self Care!  ')).toBe('self-care');
    expect(normalizeTag('Café Days')).toBe('café-days');
    expect(normalizeTag('!!!')).toBe('');
  });

  it('labels known and custom tags', () => {
    expect(tagLabel('self-care')).toBe('Self-care');
    expect(tagLabel('weekend-notes')).toBe('Weekend Notes');
  });

  it('deduplicates and caps tags', () => {
    expect(uniqueTags(['Gratitude', 'gratitude', 'self care', 'work'])).toEqual([
      'gratitude',
      'self-care',
      'work',
    ]);
    expect(uniqueTags(Array.from({ length: 12 }, (_, index) => `tag ${index}`))).toHaveLength(8);
  });

  it('toggles a tag on and off', () => {
    expect(toggleTag([], 'Gratitude')).toEqual(['gratitude']);
    expect(toggleTag(['gratitude'], 'gratitude')).toEqual([]);
    expect(toggleTag(['one'], '   ')).toEqual(['one']);
  });
});

describe('drafts and ordering', () => {
  it('sanitizes a draft', () => {
    const draft = sanitizeEntryDraft({
      title: 't'.repeat(200),
      body: 'b'.repeat(60_000),
      tags: ['Gratitude', 'gratitude'],
    });
    expect(draft.title).toHaveLength(120);
    expect(draft.body).toHaveLength(50_000);
    expect(draft.tags).toEqual(['gratitude']);
  });

  it('detects content', () => {
    expect(hasEntryContent({ title: '', body: '' })).toBe(false);
    expect(hasEntryContent({ title: ' ', body: 'x' })).toBe(true);
  });

  it('sorts newest first and ties by created time', () => {
    const entries = [
      makeEntry({ id: 'old', updatedAt: NOW - 5000, createdAt: NOW - 5000 }),
      makeEntry({ id: 'new', updatedAt: NOW, createdAt: NOW - 100 }),
      makeEntry({ id: 'tie', updatedAt: NOW - 5000, createdAt: NOW }),
    ];
    expect(sortEntriesNewestFirst(entries).map((entry) => entry.id)).toEqual(['new', 'tie', 'old']);
  });

  it('counts entries per book', () => {
    expect(
      bookEntryCounts([
        makeEntry({ bookId: 'a' }),
        makeEntry({ bookId: 'a' }),
        makeEntry({ bookId: 'b' }),
      ]),
    ).toEqual({ a: 2, b: 1 });
  });
});
