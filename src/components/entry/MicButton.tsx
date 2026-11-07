import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Animated, Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useTheme } from '@/theme/ThemeProvider';
import { PressableScale } from '../ui/PressableScale';

interface MicButtonProps {
  active: boolean;
  onPress: () => void;
  size?: number;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function MicButton({ active, onPress, size = 82, disabled, style }: MicButtonProps) {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const [pulseA] = useState(() => new Animated.Value(0));
  const [pulseB] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!active || reducedMotion) {
      pulseA.setValue(0);
      pulseB.setValue(0);
      return;
    }

    const makeLoop = (value: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(value, {
            toValue: 1,
            duration: 1700,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(value, {
            toValue: 0,
            duration: 1,
            useNativeDriver: Platform.OS !== 'web',
          }),
        ]),
      );

    const first = makeLoop(pulseA, 0);
    const second = makeLoop(pulseB, 700);
    first.start();
    second.start();
    return () => {
      first.stop();
      second.stop();
    };
  }, [active, pulseA, pulseB, reducedMotion]);

  const rings = [pulseA, pulseB];
  const iconColor = colors.accentText;

  return (
    <View style={[{ width: size * 1.7, height: size * 1.7 }, styles.wrap, style]}>
      {active
        ? rings.map((ring, index) => (
            <Animated.View
              key={index}
              pointerEvents="none"
              style={[
                styles.ring,
                {
                  width: size,
                  height: size,
                  borderRadius: size / 2,
                  borderColor: colors.micActive,
                  opacity: ring.interpolate({ inputRange: [0, 1], outputRange: [0.42, 0] }),
                  transform: [
                    {
                      scale: ring.interpolate({ inputRange: [0, 1], outputRange: [1, 1.48] }),
                    },
                  ],
                },
              ]}
            />
          ))
        : null}

      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={active ? 'Stop dictation' : 'Start voice dictation'}
        accessibilityState={{ busy: active }}
        disabled={disabled}
        onPress={onPress}
        haptic="medium"
        scaleTo={0.94}
        style={[
          styles.button,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            shadowColor: colors.shadow,
            opacity: disabled ? 0.45 : 1,
          },
        ]}>
        <LinearGradient
          colors={active ? [colors.micActive, '#8F3D3D'] : [colors.accent, colors.accentPressed]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={[styles.gradient, { borderRadius: size / 2 }]}>
          <Feather name={active ? 'square' : 'mic'} size={size * 0.34} color={iconColor} />
        </LinearGradient>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    borderWidth: 1.5,
  },
  button: {
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 16,
    elevation: 10,
  },
  gradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
