import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { AppState, Platform } from 'react-native';

import { createEmptyData, createInitialData } from '@/domain/defaults';
import { appReducer, type AppAction } from '@/domain/reducer';
import type { AppData } from '@/domain/types';
import { loadAppData, saveAppData } from '@/storage/appStorage';

type PersistenceStatus = 'loading' | 'ready';
export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

interface AppContextValue {
  state: AppData;
  dispatch: React.Dispatch<AppAction>;
  status: PersistenceStatus;
  saveState: SaveState;
  lastSavedAt: number | null;
  storageError: string | null;
  saveNow: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(appReducer, undefined, () => createEmptyData());
  const [status, setStatus] = useState<PersistenceStatus>('loading');
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [storageError, setStorageError] = useState<string | null>(null);

  const stateRef = useRef(state);
  const latestWriteRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      try {
        const stored = await loadAppData();
        if (!mounted) return;
        if (stored) {
          dispatch({ type: 'HYDRATE', data: stored });
        } else {
          dispatch({ type: 'HYDRATE', data: createInitialData() });
        }
      } catch (error) {
        if (!mounted) return;
        setStorageError('Your device storage could not be read. New words may not be saved.');
        dispatch({ type: 'HYDRATE', data: createInitialData() });
        console.warn('ddairy: could not load local data', error);
      } finally {
        if (mounted) setStatus('ready');
      }
    }

    void hydrate();
    return () => {
      mounted = false;
    };
  }, []);

  const flush = useCallback(async (snapshot: AppData) => {
    try {
      latestWriteRef.current = latestWriteRef.current
        .catch(() => undefined)
        .then(() => saveAppData(snapshot));
      await latestWriteRef.current;
      setLastSavedAt(Date.now());
      setSaveState('saved');
      setStorageError(null);
    } catch (error) {
      setSaveState('error');
      setStorageError('Your latest changes could not be saved to this device.');
      console.warn('ddairy: could not save local data', error);
    }
  }, []);

  const saveNow = useCallback(async () => {
    await flush(stateRef.current);
  }, [flush]);

  useEffect(() => {
    if (status !== 'ready') return;

    const timer = setTimeout(() => {
      setSaveState('saving');
      void flush(stateRef.current);
    }, 500);

    return () => clearTimeout(timer);
  }, [state, status, flush]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'background' || nextState === 'inactive') {
        void flush(stateRef.current);
      }
    });
    return () => subscription.remove();
  }, [flush]);

  const value = useMemo<AppContextValue>(
    () => ({
      state,
      dispatch,
      status,
      saveState,
      lastSavedAt,
      storageError,
      saveNow,
    }),
    [state, status, saveState, lastSavedAt, storageError, saveNow],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used inside AppProvider');
  }
  return context;
}

export function useActiveBook() {
  const { state } = useApp();
  return (
    state.books.find((book) => book.id === state.activeBookId) ??
    state.books.find((book) => book.isMain) ??
    state.books[0]
  );
}
