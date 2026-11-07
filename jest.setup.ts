require('@testing-library/react-native');

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

jest.mock('expo-speech-recognition', () => {
  const listeners = new Map<string, Set<(event: unknown) => void>>();

  return {
    ExpoSpeechRecognitionModule: {
      isRecognitionAvailable: jest.fn(() => true),
      requestPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
      start: jest.fn(),
      stop: jest.fn(),
      abort: jest.fn(),
      addListener: jest.fn((event: string, listener: (event: unknown) => void) => {
        const bucket = listeners.get(event) ?? new Set<(event: unknown) => void>();
        bucket.add(listener);
        listeners.set(event, bucket);
        return {
          remove: () => {
            bucket.delete(listener);
          },
        };
      }),
      __emit: (event: string, payload: unknown) => {
        listeners.get(event)?.forEach((listener) => listener(payload));
      },
      __reset: () => {
        listeners.clear();
      },
    },
  };
});

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    executionEnvironment: 'bare',
    expoConfig: { version: '1.0.0' },
  },
  ExecutionEnvironment: {
    Bare: 'bare',
    Standalone: 'standalone',
    StoreClient: 'storeClient',
  },
}));

jest.mock('expo-font', () => ({
  useFonts: () => [true, null],
  isLoaded: () => true,
  loadAsync: () => Promise.resolve(),
}));

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(() => Promise.resolve()),
  hideAsync: jest.fn(() => Promise.resolve()),
}));
