import { act, renderHook } from '@testing-library/react-native';

import { useNow } from '@/hooks/useNow';
import { NOW } from '../helpers/factories';

describe('useNow', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(NOW);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('starts with the current time and refreshes on its interval', async () => {
    const { result } = await renderHook(() => useNow(1_000));
    expect(result.current).toBe(NOW);

    await act(async () => {
      jest.advanceTimersByTime(1_000);
    });
    expect(result.current).toBe(NOW + 1_000);
  });

  it('clears the interval when unmounted', async () => {
    const { result, unmount } = await renderHook(() => useNow(1_000));
    await unmount();
    jest.advanceTimersByTime(5_000);
    expect(result.current).toBe(NOW);
    expect(jest.getTimerCount()).toBe(0);
  });
});
