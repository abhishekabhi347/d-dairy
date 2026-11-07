import { Feather } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { AppText } from './AppText';
import { PressableScale } from './PressableScale';

type FeatherName = ComponentProps<typeof Feather>['name'];

interface ChipProps {
  label: string;
  onPress?: () => void;
  selected?: boolean;
  emoji?: string;
  icon?: FeatherName;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  testID?: string;
}

export function Chip({
  label,
  onPress,
  selected = false,
  emoji,
  icon,
  style,
  accessibilityLabel,
  testID,
}: ChipProps) {
  const { colors } = useTheme();

  return (
    <PressableScale
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected }}
      onPress={onPress}
      disabled={!onPress}
      haptic="light"
      scaleTo={0.96}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? colors.accent : colors.surfaceRaised,
          borderColor: selected ? colors.accent : colors.border,
        },
        style,
      ]}>
      <View style={styles.content}>
        {emoji ? <AppText style={styles.emoji}>{emoji}</AppText> : null}
        {icon ? (
          <Feather name={icon} size={13} color={selected ? colors.accentText : colors.textSecondary} />
        ) : null}
        <AppText
          variant="bodySmall"
          numberOfLines={1}
          style={[
            styles.label,
            {
              color: selected ? colors.accentText : colors.textSecondary,
              fontFamily: selected ? 'DMSans_600SemiBold' : 'DMSans_500Medium',
            },
          ]}>
          {label}
        </AppText>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 13,
    lineHeight: 18,
  },
  emoji: {
    fontSize: 14,
    lineHeight: 18,
  },
});
