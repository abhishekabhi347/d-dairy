import { BOOK_COLORS, BOOK_ICONS, MAX_BOOK_TITLE_LENGTH } from './constants';
import type { Book } from './types';

export interface BookTitleValidation {
  valid: boolean;
  error: string | null;
  value: string;
}

export function validateBookTitle(
  title: string,
  books: readonly Book[],
  excludeId?: string,
): BookTitleValidation {
  const value = title.trim().replace(/\s+/g, ' ');
  if (!value) {
    return { valid: false, error: 'Give your book a name.', value };
  }
  if (value.length > MAX_BOOK_TITLE_LENGTH) {
    return {
      valid: false,
      error: `Keep the name under ${MAX_BOOK_TITLE_LENGTH} characters.`,
      value,
    };
  }
  const duplicate = books.some(
    (book) => book.id !== excludeId && book.title.trim().toLowerCase() === value.toLowerCase(),
  );
  if (duplicate) {
    return { valid: false, error: 'You already have a book with that name.', value };
  }
  return { valid: true, error: null, value };
}

export function createBookRecord(input: {
  id: string;
  title: string;
  icon?: string;
  color?: string;
  now?: number;
}): Book {
  const now = input.now ?? Date.now();
  return {
    id: input.id,
    title: input.title.trim().replace(/\s+/g, ' ').slice(0, MAX_BOOK_TITLE_LENGTH),
    icon: input.icon ?? BOOK_ICONS[0],
    color: input.color ?? BOOK_COLORS[0],
    isMain: false,
    createdAt: now,
    updatedAt: now,
  };
}
