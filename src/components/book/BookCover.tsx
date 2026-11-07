import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import type { Book } from '@/domain/types';
import { withAlpha, shadeHex } from '@/utils/color';
import { AppText } from '../ui/AppText';

interface BookCoverProps {
  book: Pick<Book, 'color' | 'icon'>;
  size?: 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
}

const SIZES = {
  sm: { width: 42, height: 54, radius: 10, font: 20 },
  md: { width: 58, height: 74, radius: 14, font: 28 },
  lg: { width: 82, height: 104, radius: 18, font: 40 },
} as const;

export function BookCover({ book, size = 'md', style }: BookCoverProps) {
  const dimensions = SIZES[size];

  return (
    <LinearGradient
      colors={[book.color, shadeHex(book.color, -0.22)]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.cover,
        {
          width: dimensions.width,
          height: dimensions.height,
          borderRadius: dimensions.radius,
        },
        style,
      ]}>
      <View
        style={[
          styles.spine,
          {
            left: Math.max(6, dimensions.width * 0.13),
            backgroundColor: withAlpha('#FFFFFF', 0.26),
          },
        ]}
      />
      <View
        style={[
          styles.gloss,
          {
            width: dimensions.width * 0.5,
            height: dimensions.height * 0.5,
            borderRadius: dimensions.width * 0.25,
          },
        ]}
      />
      <AppText style={{ fontSize: dimensions.font, lineHeight: dimensions.font + 4 }}>
        {book.icon}
      </AppText>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  cover: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#2A1A12',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 9,
    elevation: 5,
  },
  spine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
  },
  gloss: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
});
