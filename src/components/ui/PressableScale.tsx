import { useState } from 'react';
import {
  Animated,
  Pressable,
  Platform,
  type GestureResponderEvent,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useHaptics } from '@/hooks/useHaptics';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  haptic?: 'light' | 'medium' | 'heavy' | 'none';
}

export function PressableScale({
  style,
  scaleTo = 0.97,
  haptic = 'none',
  onPressIn,
  onPressOut,
  onPress,
  disabled,
  children,
  ...rest
}: PressableScaleProps) {
  const [scale] = useState(() => new Animated.Value(1));
  const reducedMotion = useReducedMotion();
  const triggerHaptic = useHaptics();

  const animate = (toValue: number) => {
    if (reducedMotion) {
      scale.setValue(1);
      return;
    }
    Animated.spring(scale, {
      toValue,
      useNativeDriver: Platform.OS !== 'web',
      friction: 9,
      tension: 220,
    }).start();
  };

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      accessibilityState={{ disabled: Boolean(disabled), ...rest.accessibilityState }}
      onPressIn={(event: GestureResponderEvent) => {
        animate(scaleTo);
        onPressIn?.(event);
      }}
      onPressOut={(event: GestureResponderEvent) => {
        animate(1);
        onPressOut?.(event);
      }}
      onPress={(event) => {
        if (haptic !== 'none') triggerHaptic(haptic);
        onPress?.(event);
      }}
      style={[
        style,
        { opacity: disabled ? 0.5 : 1 },
        { transform: [{ scale }] },
      ]}>
      {children}
    </AnimatedPressable>
  );
}
