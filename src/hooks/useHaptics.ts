import * as Haptics from 'expo-haptics';
import { useCallback } from 'react';
import { Platform } from 'react-native';

import { useApp } from '@/context/AppProvider';

type HapticStyle = 'light' | 'medium' | 'heavy' | 'success' | 'warning';

export function useHaptics() {
  const { state } = useApp();
  const enabled = state.settings.haptics && Platform.OS !== 'web';

  return useCallback(
    (style: HapticStyle = 'light') => {
      if (!enabled) return;
      const run =
        style === 'success'
          ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
          : style === 'warning'
            ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
            : Haptics.impactAsync(
                style === 'heavy'
                  ? Haptics.ImpactFeedbackStyle.Heavy
                  : style === 'medium'
                    ? Haptics.ImpactFeedbackStyle.Medium
                    : Haptics.ImpactFeedbackStyle.Light,
              );
      run.catch(() => undefined);
    },
    [enabled],
  );
}
