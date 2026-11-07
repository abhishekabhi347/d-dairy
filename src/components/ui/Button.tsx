import { Feather } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { AppText } from './AppText';
import { PressableScale } from './PressableScale';

type FeatherName = ComponentProps<typeof Feather>['name'];
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps {
  label: string;
  onPress: () => void;
  icon?: FeatherName;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
  testID?: string;
}

export function Button({
  label,
  onPress,
  icon,
  variant = 'primary',
  disabled,
  loading,
  style,
  accessibilityHint,
  testID,
}: ButtonProps) {
  const { colors } = useTheme();

  const palette = (() => {
    switch (variant) {
      case 'secondary':
        return {
          backgroundColor: colors.surfaceRaised,
          borderColor: colors.borderStrong,
          color: colors.text,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          color: colors.textSecondary,
        };
      case 'danger':
        return {
          backgroundColor: colors.dangerSoft,
          borderColor: colors.dangerSoft,
          color: colors.danger,
        };
      default:
        return {
          backgroundColor: colors.accent,
          borderColor: colors.accent,
          color: colors.accentText,
        };
    }
  })();

  return (
    <PressableScale
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: Boolean(disabled || loading) }}
      disabled={disabled || loading}
      onPress={onPress}
      haptic="light"
      style={[
        styles.button,
        {
          backgroundColor: palette.backgroundColor,
          borderColor: palette.borderColor,
        },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator size="small" color={palette.color} />
      ) : (
        <View style={styles.content}>
          {icon ? <Feather name={icon} size={17} color={palette.color} /> : null}
          <AppText variant="button" style={{ color: palette.color }}>
            {label}
          </AppText>
        </View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    paddingHorizontal: 20,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});
