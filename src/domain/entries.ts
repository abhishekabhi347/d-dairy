import {
  JOURNAL_KEYWORDS,
  MAX_ENTRY_BODY_LENGTH,
  MAX_ENTRY_TITLE_LENGTH,
  MAX_TAG_LENGTH,
  MAX_TAGS_PER_ENTRY,
} from './constants';
import type { Entry } from './types';

export function countWords(value: string): number {
  const text = value.trim();
  if (!text) return 0;

  const cjkCharacters = text.match(/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af]/g);
  const cjkCount = cjkCharacters?.length ?? 0;
  const withoutCjk = text.replace(/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af]/g, ' ');
  const wordCount = withoutCjk.match(/[^\s]+/g)?.length ?? 0;
  return cjkCount + wordCount;
}

export function stripMarkdown(value: string): string {
  return value
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_~`>]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim();
}

export function deriveTitle(body: string): string {
  const firstLine = body
    .split(/\r?\n/)
    .map((line) => stripMarkdown(line).trim())
    .find((line) => line.length > 0);

  if (!firstLine) return 'Untitled entry';

  const cleaned = firstLine
    .replace(/\s+/g, ' ')
    .replace(/^["'“”]+|["'“”]+$/g, '')
    .replace(/[.,;:!?]+$/g, '')
    .trim();

  if (!cleaned) return 'Untitled entry';
  if (cleaned.length <= 60) return cleaned;

  const sliced = cleaned.slice(0, 60);
  const lastSpace = sliced.lastIndexOf(' ');
  return `${sliced.slice(0, lastSpace > 30 ? lastSpace : 60).trim()}…`;
}

export function displayTitle(entry: Pick<Entry, 'title' | 'body'>): string {
  const title = stripMarkdown(entry.title).trim();
  return title || deriveTitle(entry.body);
}

export function entryExcerpt(body: string, limit = 170): string {
  const clean = stripMarkdown(body).replace(/\s+/g, ' ').trim();
  if (!clean) return 'No words yet — just a quiet page.';
  if (clean.length <= limit) return clean;
  const sliced = clean.slice(0, limit);
  const lastSpace = sliced.lastIndexOf(' ');
  return `${sliced.slice(0, lastSpace > limit * 0.6 ? lastSpace : limit).trim()}…`;
}

export function normalizeTag(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9\u00c0-\u024f\u0400-\u04ff\u0900-\u097f\u3040-\u30ff\u4e00-\u9fff\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, MAX_TAG_LENGTH);
}

export function tagLabel(tag: string): string {
  const known = JOURNAL_KEYWORDS.find((keyword) => keyword.tag === tag);
  if (known) return known.label;

  return tag
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function uniqueTags(tags: readonly string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of tags) {
    const normalized = normalizeTag(value);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
    if (result.length >= MAX_TAGS_PER_ENTRY) break;
  }
  return result;
}

export function toggleTag(tags: readonly string[], tag: string): string[] {
  const normalized = normalizeTag(tag);
  if (!normalized) return [...tags];
  if (tags.includes(normalized)) return tags.filter((item) => item !== normalized);
  return uniqueTags([...tags, normalized]);
}

export function sanitizeEntryDraft(input: {
  title: string;
  body: string;
  tags: readonly string[];
}): { title: string; body: string; tags: string[] } {
  return {
    title: input.title.slice(0, MAX_ENTRY_TITLE_LENGTH),
    body: input.body.slice(0, MAX_ENTRY_BODY_LENGTH),
    tags: uniqueTags(input.tags),
  };
}

export function hasEntryContent(entry: Pick<Entry, 'title' | 'body'>): boolean {
  return entry.title.trim().length > 0 || entry.body.trim().length > 0;
}

export function sortEntriesNewestFirst(entries: readonly Entry[]): Entry[] {
  return [...entries].sort((a, b) => {
    const updatedDifference = b.updatedAt - a.updatedAt;
    if (updatedDifference !== 0) return updatedDifference;
    return b.createdAt - a.createdAt;
  });
}

export function bookEntryCounts(entries: readonly Entry[]): Record<string, number> {
  return entries.reduce<Record<string, number>>((counts, entry) => {
    counts[entry.bookId] = (counts[entry.bookId] ?? 0) + 1;
    return counts;
  }, {});
}
