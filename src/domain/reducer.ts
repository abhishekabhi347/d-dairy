import {
  BOOK_COLORS,
  BOOK_ICONS,
  DICTATION_LANGUAGES,
  MAX_BOOKS,
  MAX_BOOK_TITLE_LENGTH,
  MAX_ENTRY_BODY_LENGTH,
  MAX_ENTRY_TITLE_LENGTH,
  MAX_TAGS_PER_ENTRY,
  MAX_TAG_LENGTH,
} from './constants';
import { uniqueTags } from './entries';
import { createId } from './id';
import type { AppData, Book, Entry, MoodId, Settings, ThemePreference } from './types';

export type AppAction =
  | { type: 'HYDRATE'; data: AppData }
  | { type: 'SET_ACTIVE_BOOK'; bookId: string }
  | { type: 'CREATE_BOOK'; book: Book }
  | { type: 'UPDATE_BOOK'; id: string; changes: Pick<Book, 'title' | 'icon' | 'color'> }
  | { type: 'DELETE_BOOK'; id: string }
  | { type: 'UPSERT_ENTRY'; entry: Entry }
  | { type: 'DELETE_ENTRY'; id: string }
  | { type: 'TOGGLE_FAVORITE'; id: string }
  | { type: 'UPDATE_SETTINGS'; changes: Partial<Settings> }
  | { type: 'RESET_DATA'; data: AppData };

const THEMES: ThemePreference[] = ['system', 'light', 'dark'];

function clampText(value: string, max: number): string {
  return value.slice(0, max);
}

function normalizeTags(tags: readonly string[]): string[] {
  return uniqueTags(tags)
    .map((tag) => tag.slice(0, MAX_TAG_LENGTH))
    .filter(Boolean)
    .slice(0, MAX_TAGS_PER_ENTRY);
}

function normalizeMood(value: unknown): MoodId | null {
  return value === 'rough' || value === 'low' || value === 'okay' || value === 'good' || value === 'great'
    ? value
    : null;
}

export function sanitizeEntry(entry: Entry): Entry {
  return {
    id: entry.id,
    bookId: entry.bookId,
    title: clampText(entry.title, MAX_ENTRY_TITLE_LENGTH),
    body: clampText(entry.body, MAX_ENTRY_BODY_LENGTH),
    mood: normalizeMood(entry.mood),
    tags: normalizeTags(entry.tags),
    favorite: Boolean(entry.favorite),
    createdAt: Number.isFinite(entry.createdAt) ? entry.createdAt : Date.now(),
    updatedAt: Number.isFinite(entry.updatedAt) ? entry.updatedAt : Date.now(),
  };
}

function withTouchedBook(books: readonly Book[], bookId: string, now: number): Book[] {
  return books.map((book) => (book.id === bookId ? { ...book, updatedAt: now } : book));
}

export function appReducer(state: AppData, action: AppAction): AppData {
  switch (action.type) {
    case 'HYDRATE':
      return action.data;

    case 'SET_ACTIVE_BOOK': {
      if (!state.books.some((book) => book.id === action.bookId)) return state;
      if (state.activeBookId === action.bookId) return state;
      return { ...state, activeBookId: action.bookId };
    }

    case 'CREATE_BOOK': {
      if (state.books.length >= MAX_BOOKS) return state;
      const title = action.book.title.trim().replace(/\s+/g, ' ');
      if (!title || title.length > MAX_BOOK_TITLE_LENGTH) return state;
      if (
        state.books.some((book) => book.title.toLowerCase() === title.toLowerCase()) ||
        state.books.some((book) => book.id === action.book.id)
      ) {
        return state;
      }

      const now = Date.now();
      const book: Book = {
        id: action.book.id,
        title,
        icon: BOOK_ICONS.includes(action.book.icon as (typeof BOOK_ICONS)[number])
          ? action.book.icon
          : BOOK_ICONS[0],
        color: BOOK_COLORS.includes(action.book.color as (typeof BOOK_COLORS)[number])
          ? action.book.color
          : BOOK_COLORS[0],
        isMain: false,
        createdAt: action.book.createdAt || now,
        updatedAt: now,
      };

      return {
        ...state,
        books: [...state.books, book],
        activeBookId: book.id,
      };
    }

    case 'UPDATE_BOOK': {
      const book = state.books.find((item) => item.id === action.id);
      if (!book) return state;

      const title = action.changes.title.trim().replace(/\s+/g, ' ');
      if (!title || title.length > MAX_BOOK_TITLE_LENGTH) return state;
      if (
        state.books.some(
          (item) => item.id !== action.id && item.title.toLowerCase() === title.toLowerCase(),
        )
      ) {
        return state;
      }

      const icon = BOOK_ICONS.includes(action.changes.icon as (typeof BOOK_ICONS)[number])
        ? action.changes.icon
        : book.icon;
      const color = BOOK_COLORS.includes(action.changes.color as (typeof BOOK_COLORS)[number])
        ? action.changes.color
        : book.color;

      return {
        ...state,
        books: state.books.map((item) =>
          item.id === action.id
            ? { ...item, title, icon, color, updatedAt: Date.now() }
            : item,
        ),
      };
    }

    case 'DELETE_BOOK': {
      const book = state.books.find((item) => item.id === action.id);
      if (!book || book.isMain || state.books.length <= 1) return state;

      const books = state.books.filter((item) => item.id !== action.id);
      const fallback = books.find((item) => item.isMain) ?? books[0];
      return {
        ...state,
        books,
        entries: state.entries.filter((entry) => entry.bookId !== action.id),
        activeBookId:
          state.activeBookId === action.id ? fallback.id : state.activeBookId,
      };
    }

    case 'UPSERT_ENTRY': {
      const existingIndex = state.entries.findIndex((entry) => entry.id === action.entry.id);
      if (!state.books.some((book) => book.id === action.entry.bookId)) return state;

      const sanitized = sanitizeEntry(action.entry);
      const entry =
        existingIndex === -1
          ? sanitized
          : { ...sanitized, createdAt: state.entries[existingIndex].createdAt };
      const isBlank = !entry.title.trim() && !entry.body.trim();
      if (existingIndex === -1 && isBlank) return state;

      const entries =
        existingIndex === -1
          ? [entry, ...state.entries]
          : state.entries.map((item, index) => (index === existingIndex ? entry : item));

      return {
        ...state,
        entries,
        books: withTouchedBook(state.books, entry.bookId, entry.updatedAt),
      };
    }

    case 'DELETE_ENTRY':
      return {
        ...state,
        entries: state.entries.filter((entry) => entry.id !== action.id),
      };

    case 'TOGGLE_FAVORITE': {
      const exists = state.entries.some((entry) => entry.id === action.id);
      if (!exists) return state;
      return {
        ...state,
        entries: state.entries.map((entry) =>
          entry.id === action.id
            ? { ...entry, favorite: !entry.favorite, updatedAt: Date.now() }
            : entry,
        ),
      };
    }

    case 'UPDATE_SETTINGS': {
      const { changes } = action;
      const next: Settings = { ...state.settings };

      if (changes.theme && THEMES.includes(changes.theme)) next.theme = changes.theme;
      if (typeof changes.haptics === 'boolean') next.haptics = changes.haptics;
      if (typeof changes.smartPunctuation === 'boolean') {
        next.smartPunctuation = changes.smartPunctuation;
      }
      if (typeof changes.removeFillers === 'boolean') next.removeFillers = changes.removeFillers;
      if (
        changes.dictationLanguage &&
        DICTATION_LANGUAGES.some((language) => language.code === changes.dictationLanguage)
      ) {
        next.dictationLanguage = changes.dictationLanguage;
      }

      return { ...state, settings: next };
    }

    case 'RESET_DATA':
      return action.data;

    default:
      return state;
  }
}

export function makeNewEntry(bookId: string, now: number = Date.now()): Entry {
  return {
    id: createId('entry'),
    bookId,
    title: '',
    body: '',
    mood: null,
    tags: [],
    favorite: false,
    createdAt: now,
    updatedAt: now,
  };
}
