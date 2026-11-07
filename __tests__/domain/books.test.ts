import { createBookRecord, validateBookTitle } from '@/domain/books';
import { BOOK_COLORS, BOOK_ICONS, MAX_BOOK_TITLE_LENGTH } from '@/domain/constants';
import { makeBook, NOW } from '../helpers/factories';

const BOOKS = [makeBook({ id: 'main', title: 'My Diary' }), makeBook({ id: 'trips', title: 'Trips' })];

describe('validateBookTitle', () => {
  it('requires a name', () => {
    expect(validateBookTitle('   ', BOOKS)).toEqual({
      valid: false,
      error: 'Give your book a name.',
      value: '',
    });
  });

  it('normalizes whitespace before validating', () => {
    expect(validateBookTitle('  Slow   Mornings  ', BOOKS)).toEqual({
      valid: true,
      error: null,
      value: 'Slow Mornings',
    });
  });

  it('rejects names that are too long', () => {
    const result = validateBookTitle('a'.repeat(MAX_BOOK_TITLE_LENGTH + 1), BOOKS);
    expect(result.valid).toBe(false);
    expect(result.error).toContain(String(MAX_BOOK_TITLE_LENGTH));
  });

  it('rejects duplicate names regardless of case', () => {
    expect(validateBookTitle('  my diary ', BOOKS).valid).toBe(false);
    expect(validateBookTitle('TRIPS', BOOKS).valid).toBe(false);
  });

  it('allows the current book to keep its name when excluded', () => {
    expect(validateBookTitle('Trips', BOOKS, 'trips').valid).toBe(true);
  });
});

describe('createBookRecord', () => {
  it('builds a trimmed, non-main book with defaults', () => {
    const book = createBookRecord({ id: 'book_1', title: '  Coast   Notes  ', now: NOW });
    expect(book).toEqual({
      id: 'book_1',
      title: 'Coast Notes',
      icon: BOOK_ICONS[0],
      color: BOOK_COLORS[0],
      isMain: false,
      createdAt: NOW,
      updatedAt: NOW,
    });
  });

  it('accepts a custom icon and color and caps the title', () => {
    const book = createBookRecord({
      id: 'book_2',
      title: 'x'.repeat(100),
      icon: BOOK_ICONS[2],
      color: BOOK_COLORS[3],
      now: NOW,
    });
    expect(book.title).toHaveLength(MAX_BOOK_TITLE_LENGTH);
    expect(book.icon).toBe(BOOK_ICONS[2]);
    expect(book.color).toBe(BOOK_COLORS[3]);
  });
});
