import {
  DEFAULT_TAG_SUGGESTIONS,
  JOURNAL_KEYWORDS,
  MAX_TAGS_PER_ENTRY,
} from './constants';
import { normalizeForSearch } from './search';
import { normalizeTag, tagLabel, uniqueTags } from './entries';
import type { Entry } from './types';

/**
 * Content-aware tag suggestions. Keyword clusters are based on the language
 * people use in popular journaling and voice-journal apps.
 */
export function suggestTags(
  text: string,
  selected: readonly string[] = [],
  limit = 6,
): string[] {
  const haystack = ` ${normalizeForSearch(text)} `;
  const selectedSet = new Set(selected);
  const scored: { tag: string; score: number; order: number }[] = [];

  JOURNAL_KEYWORDS.forEach((keyword, order) => {
    let score = 0;
    for (const term of keyword.terms) {
      const normalizedTerm = normalizeForSearch(term);
      if (!normalizedTerm) continue;
      const occurrences = haystack.split(` ${normalizedTerm}`).length - 1;
      if (occurrences > 0) {
        score += occurrences;
      }
      if (haystack.includes(` ${normalizedTerm} `)) score += 1;
    }
    if (score > 0 && !selectedSet.has(keyword.tag)) {
      scored.push({ tag: keyword.tag, score, order });
    }
  });

  scored.sort((a, b) => b.score - a.score || a.order - b.order);

  const result = scored.map((item) => item.tag);
  for (const fallback of DEFAULT_TAG_SUGGESTIONS) {
    if (result.length >= limit) break;
    if (!selectedSet.has(fallback) && !result.includes(fallback)) result.push(fallback);
  }

  return uniqueTags(result).slice(0, Math.min(limit, MAX_TAGS_PER_ENTRY));
}

export function popularTags(entries: readonly Entry[], limit = 8): string[] {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    for (const tag of entry.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([tag]) => tag);
}

export function suggestionsForEntry(entry: Entry, limit = 6): string[] {
  return suggestTags(`${entry.title} ${entry.body}`, entry.tags, limit).sort((a, b) =>
    tagLabel(a).localeCompare(tagLabel(b)),
  );
}

export function keywordLabel(tag: string): string {
  return tagLabel(normalizeTag(tag));
}
