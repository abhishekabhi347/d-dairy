import { useEffect, useState, type PropsWithChildren } from 'react';
import { Animated, Platform, type StyleProp, type ViewStyle } from 'react-native';

import { useReducedMotion } from '@/hooks/useReducedMotion';

interface FadeInViewProps extends PropsWithChildren {
  delay?: number;
  duration?: number;
  offset?: number;
  style?: StyleProp<ViewStyle>;
}

export function FadeInView({
  children,
  delay = 0,
  duration = 380,
  offset = 14,
  style,
}: FadeInViewProps) {
  const [progress] = useState(() => new Animated.Value(0));
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      progress.setValue(1);
      return;
    }
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration,
      delay,
      useNativeDriver: Platform.OS !== 'web',
    });
    animation.start();
    return () => animation.stop();
  }, [delay, duration, progress, reducedMotion]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [offset, 0],
              }),
            },
          ],
        },
      ]}>
      {children}
    </Animated.View>
  );
}
