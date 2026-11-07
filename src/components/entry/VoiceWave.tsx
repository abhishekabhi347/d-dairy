import { useEffect, useMemo, useState } from 'react';
import { Animated, Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useReducedMotion } from '@/hooks/useReducedMotion';

interface VoiceWaveProps {
  active?: boolean;
  level?: number;
  color: string;
  mutedColor?: string;
  bars?: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

export function VoiceWave({
  active = false,
  level = 0,
  color,
  mutedColor,
  bars = 22,
  height = 44,
  style,
}: VoiceWaveProps) {
  const reducedMotion = useReducedMotion();
  const [values] = useState(() =>
    Array.from({ length: 40 }, () => new Animated.Value(0.32)),
  );

  const heights = useMemo(
    () =>
      Array.from({ length: bars }, (_, index) => {
        const wave = (Math.sin(index * 1.47) + 1) / 2;
        return 7 + wave * height * 0.7;
      }),
    [bars, height],
  );

  useEffect(() => {
    const useNativeDriver = Platform.OS !== 'web';
    values.forEach((value) => value.stopAnimation());

    if (!active || reducedMotion) {
      values.slice(0, bars).forEach((value, index) => {
        value.setValue(reducedMotion && active ? 0.55 + (index % 3) * 0.1 : 0.28);
      });
      return;
    }

    const loops = values.slice(0, bars).map((value, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay((index % 7) * 42),
          Animated.timing(value, {
            toValue: 1,
            duration: 330 + (index % 5) * 54,
            useNativeDriver,
          }),
          Animated.timing(value, {
            toValue: 0.24,
            duration: 380 + (index % 4) * 61,
            useNativeDriver,
          }),
        ]),
      ),
    );

    loops.forEach((loop) => loop.start());
    return () => loops.forEach((loop) => loop.stop());
  }, [active, bars, reducedMotion, values]);

  const normalizedLevel = Math.max(0, Math.min(1, level));

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.wave, { height }, style]}>
      {heights.map((barHeight, index) => (
        <Animated.View
          key={index}
          style={[
            styles.bar,
            {
              height: Math.max(5, barHeight + normalizedLevel * height * 0.35),
              borderRadius: 4,
              backgroundColor: active ? color : (mutedColor ?? color),
              opacity: active ? 0.72 + normalizedLevel * 0.28 : 0.57,
              transform: [{ scaleY: values[index] }],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wave: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  bar: {
    width: 3,
  },
});
