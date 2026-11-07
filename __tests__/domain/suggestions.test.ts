import { DEFAULT_TAG_SUGGESTIONS, MAX_TAGS_PER_ENTRY } from '@/domain/constants';
import {
  keywordLabel,
  popularTags,
  suggestTags,
  suggestionsForEntry,
} from '@/domain/suggestions';
import { makeEntry } from '../helpers/factories';

describe('suggestTags', () => {
  it('suggests tags from the language in the entry', () => {
    expect(suggestTags('I am so grateful for my family today')).toEqual(
      expect.arrayContaining(['gratitude', 'family']),
    );
    expect(suggestTags('I am so grateful for my family today')[0]).toBe('gratitude');
  });

  it('ignores tags that are already selected', () => {
    const suggestions = suggestTags('I am grateful', ['gratitude']);
    expect(suggestions).not.toContain('gratitude');
  });

  it('fills the list with gentle defaults when there is no signal', () => {
    expect(suggestTags('blorp zzz', [], 4)).toEqual(DEFAULT_TAG_SUGGESTIONS.slice(0, 4));
  });

  it('caps suggestions at the requested limit and the tag maximum', () => {
    expect(suggestTags('work project deadline', [], 2)).toHaveLength(2);
    expect(suggestTags('work project deadline', [], 100).length).toBeLessThanOrEqual(
      MAX_TAGS_PER_ENTRY,
    );
  });

  it('is accent and case insensitive', () => {
    expect(suggestTags('GRATEFUL and calm')).toEqual(
      expect.arrayContaining(['gratitude', 'mindfulness']),
    );
  });
});

describe('popularTags', () => {
  it('orders tags by frequency then alphabetically', () => {
    const entries = [
      makeEntry({ id: 'a', tags: ['work', 'wins'] }),
      makeEntry({ id: 'b', tags: ['work', 'family'] }),
      makeEntry({ id: 'c', tags: ['wins'] }),
    ];
    expect(popularTags(entries)).toEqual(['wins', 'work', 'family']);
  });

  it('respects the limit', () => {
    const entries = [makeEntry({ tags: ['one', 'two', 'three'] })];
    expect(popularTags(entries, 2)).toHaveLength(2);
  });
});

describe('suggestionsForEntry', () => {
  it('excludes existing tags and sorts labels for a calm presentation', () => {
    const entry = makeEntry({
      title: 'A grateful walk',
      body: 'I felt calm and proud of the progress I made.',
      tags: ['gratitude'],
    });
    const suggestions = suggestionsForEntry(entry);

    expect(suggestions).not.toContain('gratitude');
    expect(suggestions).toEqual(
      [...suggestions].sort((a, b) => keywordLabel(a).localeCompare(keywordLabel(b))),
    );
    expect(suggestions).toEqual(expect.arrayContaining(['mindfulness', 'wins']));
  });
});

describe('keywordLabel', () => {
  it('normalizes and humanizes a keyword', () => {
    expect(keywordLabel('Self Care')).toBe('Self-care');
    expect(keywordLabel('weekend-notes')).toBe('Weekend Notes');
  });
});
