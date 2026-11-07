import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEFAULT_SETTINGS } from '@/domain/defaults';
import {
  BOOK_COLORS,
  BOOK_ICONS,
  DICTATION_LANGUAGES,
  MAX_BOOKS,
  MAX_BOOK_TITLE_LENGTH,
} from '@/domain/constants';
import { sanitizeEntry } from '@/domain/reducer';
import { DATA_VERSION, type AppData, type Book, type Entry, type Settings } from '@/domain/types';

export const STORAGE_KEY = '@d-dairy/app-data/v1';
export const LEGACY_STORAGE_KEY = '@ddairy/app-data/v1';
export const LEGACY_ORIGINAL_STORAGE_KEY = '@ddairy/app-data';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asFiniteNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function normalizeSettings(value: unknown): Settings {
  if (!isRecord(value)) return { ...DEFAULT_SETTINGS };

  const theme =
    value.theme === 'light' || value.theme === 'dark' || value.theme === 'system'
      ? value.theme
      : DEFAULT_SETTINGS.theme;
  const language =
    typeof value.dictationLanguage === 'string' &&
    DICTATION_LANGUAGES.some((item) => item.code === value.dictationLanguage)
      ? value.dictationLanguage
      : DEFAULT_SETTINGS.dictationLanguage;

  return {
    theme,
    haptics: typeof value.haptics === 'boolean' ? value.haptics : DEFAULT_SETTINGS.haptics,
    smartPunctuation:
      typeof value.smartPunctuation === 'boolean'
        ? value.smartPunctuation
        : DEFAULT_SETTINGS.smartPunctuation,
    removeFillers:
      typeof value.removeFillers === 'boolean'
        ? value.removeFillers
        : DEFAULT_SETTINGS.removeFillers,
    dictationLanguage: language,
  };
}

function sanitizeBooks(value: unknown, now: number): Book[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();

  const books: Book[] = [];
  for (const item of value.slice(0, MAX_BOOKS)) {
    if (!isRecord(item)) continue;
    const id = asString(item.id).trim();
    const title = asString(item.title).trim().replace(/\s+/g, ' ').slice(0, MAX_BOOK_TITLE_LENGTH);
    if (!id || !title || seen.has(id)) continue;
    seen.add(id);

    const color = asString(item.color);
    const icon = asString(item.icon);
    const createdAt = asFiniteNumber(item.createdAt, now);

    books.push({
      id,
      title,
      icon: BOOK_ICONS.includes(icon as (typeof BOOK_ICONS)[number]) ? icon : BOOK_ICONS[0],
      color: BOOK_COLORS.includes(color as (typeof BOOK_COLORS)[number]) ? color : BOOK_COLORS[0],
      isMain: Boolean(item.isMain),
      createdAt,
      updatedAt: asFiniteNumber(item.updatedAt, createdAt),
    });
  }

  if (books.length === 0) return [];

  let mainFound = false;
  return books.map((book) => {
    if (book.isMain && !mainFound) {
      mainFound = true;
      return book;
    }
    return { ...book, isMain: false };
  }).map((book, index) => (index === 0 && !mainFound ? { ...book, isMain: true } : book));
}

function sanitizeEntries(value: unknown, bookIds: Set<string>): Entry[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const entries: Entry[] = [];

  for (const item of value) {
    if (!isRecord(item)) continue;
    const id = asString(item.id).trim();
    const bookId = asString(item.bookId).trim();
    if (!id || !bookId || !bookIds.has(bookId) || seen.has(id)) continue;

    const title = asString(item.title);
    const body = asString(item.body);
    if (!title.trim() && !body.trim()) continue;

    seen.add(id);
    const createdAt = asFiniteNumber(item.createdAt, Date.now());
    entries.push(
      sanitizeEntry({
        id,
        bookId,
        title,
        body,
        mood: item.mood as Entry['mood'],
        tags: Array.isArray(item.tags) ? item.tags.filter((tag): tag is string => typeof tag === 'string') : [],
        favorite: Boolean(item.favorite),
        createdAt,
        updatedAt: asFiniteNumber(item.updatedAt, createdAt),
      }),
    );
  }

  return entries;
}

/**
 * Validates untrusted/older persisted JSON and returns a safe AppData object.
 * Unknown fields are dropped, orphaned entries are removed, and exactly one
 * book is marked as the main diary.
 */
export function deserializeAppData(raw: unknown, now: number = Date.now()): AppData | null {
  if (!isRecord(raw)) return null;

  const books = sanitizeBooks(raw.books, now);
  if (books.length === 0) return null;

  const bookIds = new Set(books.map((book) => book.id));
  const entries = sanitizeEntries(raw.entries, bookIds);
  const activeBookId =
    typeof raw.activeBookId === 'string' && bookIds.has(raw.activeBookId)
      ? raw.activeBookId
      : (books.find((book) => book.isMain) ?? books[0]).id;

  return {
    version: DATA_VERSION,
    activeBookId,
    books,
    entries,
    settings: normalizeSettings(raw.settings),
  };
}

export function parseAppData(serialized: string | null, now: number = Date.now()): AppData | null {
  if (!serialized) return null;
  try {
    return deserializeAppData(JSON.parse(serialized), now);
  } catch {
    return null;
  }
}

export function serializeAppData(data: AppData): string {
  return JSON.stringify(data);
}

export interface StorageLike {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export async function loadAppData(
  storage: StorageLike = AsyncStorage,
  now: number = Date.now(),
): Promise<AppData | null> {
  const current = parseAppData(await storage.getItem(STORAGE_KEY), now);
  if (current) return current;
  // Fall back to pre-rename keys so existing installs keep their pages.
  for (const key of [LEGACY_STORAGE_KEY, LEGACY_ORIGINAL_STORAGE_KEY]) {
    const legacy = parseAppData(await storage.getItem(key), now);
    if (legacy) return legacy;
  }
  return null;
}

export async function saveAppData(
  data: AppData,
  storage: StorageLike = AsyncStorage,
): Promise<void> {
  await storage.setItem(STORAGE_KEY, serializeAppData(data));
}

export async function clearAppData(storage: StorageLike = AsyncStorage): Promise<void> {
  await storage.removeItem(STORAGE_KEY);
  await storage.removeItem(LEGACY_STORAGE_KEY);
  await storage.removeItem(LEGACY_ORIGINAL_STORAGE_KEY);
}
