import AsyncStorage from '@react-native-async-storage/async-storage';
import { render, screen, userEvent, waitFor } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';

import { AppProvider, useApp } from '@/context/AppProvider';
import { createBookRecord } from '@/domain/books';
import { parseAppData, saveAppData, STORAGE_KEY } from '@/storage/appStorage';
import { makeData, makeEntry, NOW } from '../helpers/factories';

function Probe() {
  const { state, status, saveState, storageError, saveNow, dispatch } = useApp();
  const activeBook =
    state.books.find((book) => book.id === state.activeBookId) ?? state.books[0];

  return (
    <>
      <Text testID="status">{status}</Text>
      <Text testID="book-count">{state.books.length}</Text>
      <Text testID="entry-count">{state.entries.length}</Text>
      <Text testID="active-book">{activeBook?.title ?? ''}</Text>
      <Text testID="save-state">{saveState}</Text>
      <Text testID="storage-error">{storageError ?? ''}</Text>
      <Pressable
        testID="add-book"
        onPress={() =>
          dispatch({
            type: 'CREATE_BOOK',
            book: createBookRecord({ id: 'book_trips', title: 'Trips', now: NOW }),
          })
        }>
        <Text>Add book</Text>
      </Pressable>
      <Pressable
        testID="save-now"
        onPress={() => {
          void saveNow();
        }}>
        <Text>Save now</Text>
      </Pressable>
    </>
  );
}

async function renderProvider() {
  return render(
    <AppProvider>
      <Probe />
    </AppProvider>,
  );
}

describe('AppProvider', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('hydrates a fresh diary when storage is empty', async () => {
    await renderProvider();

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('ready');
    });
    expect(screen.getByTestId('book-count')).toHaveTextContent('1');
    expect(screen.getByTestId('entry-count')).toHaveTextContent('1');
    expect(screen.getByTestId('active-book')).toHaveTextContent('My Diary');
  });

  it('restores previously saved pages', async () => {
    const stored = makeData({
      books: makeData().books,
      entries: [makeEntry({ id: 'saved', body: 'A saved thought' })],
    });
    await saveAppData(stored);

    await renderProvider();

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('ready');
    });
    expect(screen.getByTestId('active-book')).toHaveTextContent('My Diary');
    expect(screen.getByTestId('entry-count')).toHaveTextContent('1');
  });

  it('persists reducer changes through saveNow', async () => {
    await renderProvider();
    await screen.findByTestId('status');

    await userEvent.press(screen.getByTestId('add-book'));
    await waitFor(() => {
      expect(screen.getByTestId('book-count')).toHaveTextContent('2');
    });
    expect(screen.getByTestId('active-book')).toHaveTextContent('Trips');

    await userEvent.press(screen.getByTestId('save-now'));
    await waitFor(() => {
      expect(screen.getByTestId('save-state')).toHaveTextContent('saved');
    });

    await waitFor(async () => {
      const stored = parseAppData(await AsyncStorage.getItem(STORAGE_KEY), NOW);
      expect(stored?.books.map((book) => book.title)).toEqual(['My Diary', 'Trips']);
    });
  });

  it('falls back to a fresh diary and reports unreadable storage', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('disk unavailable'));

    await renderProvider();

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('ready');
    });
    expect(screen.getByTestId('storage-error')).toHaveTextContent(
      'Your device storage could not be read. New words may not be saved.',
    );
    expect(screen.getByTestId('book-count')).toHaveTextContent('1');
    expect(warn).toHaveBeenCalled();
  });
});
