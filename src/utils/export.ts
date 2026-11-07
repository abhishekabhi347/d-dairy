import { Platform, Share } from 'react-native';

import { MOOD_BY_ID } from '@/domain/constants';
import { formatLongDate, formatTime, localDateKey } from '@/domain/date';
import { displayTitle, tagLabel } from '@/domain/entries';
import type { AppData } from '@/domain/types';

export function buildMarkdownExport(data: AppData, now: number = Date.now()): string {
  const lines: string[] = [];
  lines.push('# d-dairy — my pages');
  lines.push('');
  lines.push(`_Exported ${formatLongDate(now)}_`);
  lines.push('');

  const books = [...data.books].sort((a, b) => Number(b.isMain) - Number(a.isMain));
  for (const book of books) {
    const entries = data.entries
      .filter((entry) => entry.bookId === book.id)
      .sort((a, b) => a.createdAt - b.createdAt);
    lines.push(`## ${book.isMain ? 'Main diary' : 'Book'} · ${book.title}`);
    lines.push('');

    if (entries.length === 0) {
      lines.push('_No pages yet._');
      lines.push('');
      continue;
    }

    for (const entry of entries) {
      lines.push(`### ${displayTitle(entry)}`);
      const meta = [formatLongDate(entry.createdAt), formatTime(entry.createdAt)];
      if (entry.mood) meta.push(MOOD_BY_ID[entry.mood].label);
      if (entry.tags.length > 0) meta.push(entry.tags.map(tagLabel).join(', '));
      lines.push(`_${meta.join(' · ')}_`);
      lines.push('');
      lines.push(entry.body.trim() || '_(No words.)_');
      lines.push('');
    }
  }

  lines.push('---');
  lines.push('Made with d-dairy. A softer place for your days.');
  return lines.join('\n');
}

export async function exportJournal(data: AppData): Promise<'shared' | 'downloaded'> {
  const markdown = buildMarkdownExport(data);
  const fileName = `d-dairy-${localDateKey(Date.now())}.md`;

  if (Platform.OS === 'web') {
    const scope = globalThis as unknown as {
      document?: {
        createElement: (tag: string) => {
          href: string;
          download: string;
          click: () => void;
        };
      };
      URL?: {
        createObjectURL: (blob: Blob) => string;
        revokeObjectURL: (url: string) => void;
      };
      Blob?: new (parts: string[], options: { type: string }) => Blob;
    };
    if (scope.document && scope.URL && scope.Blob) {
      const blob = new scope.Blob([markdown], { type: 'text/markdown;charset=utf-8' });
      const url = scope.URL.createObjectURL(blob);
      const anchor = scope.document.createElement('a');
      anchor.href = url;
      anchor.download = fileName;
      anchor.click();
      scope.URL.revokeObjectURL(url);
      return 'downloaded';
    }
  }

  await Share.share({
    title: 'My d-dairy pages',
    message: markdown,
  });
  return 'shared';
}
