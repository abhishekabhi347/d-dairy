import { StyleSheet, View } from 'react-native';

import { MOODS } from '@/domain/constants';
import type { MoodId } from '@/domain/types';
import { FONTS } from '@/theme/colors';
import { useTheme } from '@/theme/ThemeProvider';
import { withAlpha } from '@/utils/color';
import { AppText } from '../ui/AppText';
import { PressableScale } from '../ui/PressableScale';

interface MoodPickerProps {
  value: MoodId | null;
  onChange: (mood: MoodId | null) => void;
}

export function MoodPicker({ value, onChange }: MoodPickerProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel="Mood for this entry">
      {MOODS.map((mood) => {
        const selected = mood.id === value;
        return (
          <PressableScale
            key={mood.id}
            accessibilityRole="radio"
            accessibilityLabel={mood.label}
            accessibilityState={{ selected }}
            onPress={() => onChange(selected ? null : mood.id)}
            scaleTo={0.93}
            haptic="light"
            style={[
              styles.mood,
              {
                backgroundColor: selected ? withAlpha(mood.color, 0.16) : colors.surfaceRaised,
                borderColor: selected ? withAlpha(mood.color, 0.62) : colors.border,
              },
            ]}>
            <AppText style={[styles.emoji, !selected && styles.emojiIdle]}>{mood.emoji}</AppText>
            <AppText
              variant="caption"
              style={{
                color: selected ? mood.color : colors.textTertiary,
                fontFamily: selected ? FONTS.semibold : FONTS.medium,
              }}>
              {mood.label}
            </AppText>
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mood: {
    alignItems: 'center',
    gap: 3,
    minWidth: 58,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  emoji: {
    fontSize: 21,
    lineHeight: 26,
  },
  emojiIdle: {
    opacity: 0.72,
  },
});
