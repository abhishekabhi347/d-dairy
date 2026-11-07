import { BOOK_COLORS, BOOK_ICONS, MAX_ENTRY_BODY_LENGTH } from './constants';
import { createId } from './id';
import { DATA_VERSION, type AppData, type Book, type Entry, type Settings } from './types';

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  haptics: true,
  smartPunctuation: true,
  removeFillers: true,
  dictationLanguage: 'en-US',
};

export const WELCOME_BODY = `Welcome to d-dairy.

Tap the microphone and talk about your day. Your words will appear here, softly tidied up as you speak.

You can write instead, too. Create another book for trips, ideas, or anything that deserves its own space.

This page is yours. Keep it, edit it, or let it go.`;

export function createInitialData(now: number = Date.now()): AppData {
  const mainBook: Book = {
    id: createId('book'),
    title: 'My Diary',
    icon: BOOK_ICONS[0],
    color: BOOK_COLORS[0],
    isMain: true,
    createdAt: now,
    updatedAt: now,
  };

  const welcomeEntry: Entry = {
    id: createId('entry'),
    bookId: mainBook.id,
    title: 'A little room for your days',
    body: WELCOME_BODY.slice(0, MAX_ENTRY_BODY_LENGTH),
    mood: 'good',
    tags: ['reflection'],
    favorite: false,
    createdAt: now,
    updatedAt: now,
  };

  return {
    version: DATA_VERSION,
    activeBookId: mainBook.id,
    books: [mainBook],
    entries: [welcomeEntry],
    settings: { ...DEFAULT_SETTINGS },
  };
}

export function createEmptyData(now: number = Date.now()): AppData {
  const data = createInitialData(now);
  return { ...data, entries: [] };
}
