import { Feather } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { PressableScale } from './PressableScale';

type FeatherName = ComponentProps<typeof Feather>['name'];
type Variant = 'plain' | 'surface' | 'accent' | 'danger';

interface IconButtonProps {
  icon: FeatherName;
  onPress: () => void;
  accessibilityLabel: string;
  variant?: Variant;
  size?: number;
  iconSize?: number;
  disabled?: boolean;
  color?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  variant = 'plain',
  size = 44,
  iconSize = 20,
  disabled,
  color,
  style,
  testID,
}: IconButtonProps) {
  const { colors } = useTheme();

  const palette = (() => {
    switch (variant) {
      case 'surface':
        return { backgroundColor: colors.surfaceRaised, borderColor: colors.border, color: colors.text };
      case 'accent':
        return { backgroundColor: colors.accent, borderColor: colors.accent, color: colors.accentText };
      case 'danger':
        return { backgroundColor: colors.dangerSoft, borderColor: colors.dangerSoft, color: colors.danger };
      default:
        return { backgroundColor: 'transparent', borderColor: 'transparent', color: colors.textSecondary };
    }
  })();

  return (
    <PressableScale
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={onPress}
      haptic="light"
      style={[
        styles.button,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: palette.backgroundColor,
          borderColor: palette.borderColor,
        },
        style,
      ]}>
      <View pointerEvents="none">
        <Feather name={icon} size={iconSize} color={color ?? palette.color} />
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
});
