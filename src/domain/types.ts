export const DATA_VERSION = 1 as const;

export type ThemePreference = 'system' | 'light' | 'dark';

export type MoodId = 'rough' | 'low' | 'okay' | 'good' | 'great';

export interface Book {
  id: string;
  title: string;
  icon: string;
  color: string;
  isMain: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Entry {
  id: string;
  bookId: string;
  title: string;
  body: string;
  mood: MoodId | null;
  tags: string[];
  favorite: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Settings {
  theme: ThemePreference;
  haptics: boolean;
  smartPunctuation: boolean;
  removeFillers: boolean;
  dictationLanguage: string;
}

export interface AppData {
  version: typeof DATA_VERSION;
  activeBookId: string;
  books: Book[];
  entries: Entry[];
  settings: Settings;
}

export interface Mood {
  id: MoodId;
  emoji: string;
  label: string;
  color: string;
}

export interface JournalKeyword {
  tag: string;
  label: string;
  prompt: string;
  terms: readonly string[];
}

export interface DictationLanguage {
  code: string;
  label: string;
  nativeLabel: string;
}
