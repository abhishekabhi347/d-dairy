import { Text, type TextProps, type TextStyle } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

export type TextVariant =
  | 'display'
  | 'title'
  | 'heading'
  | 'subheading'
  | 'body'
  | 'bodySmall'
  | 'label'
  | 'caption'
  | 'button'
  | 'quote';

interface AppTextProps extends TextProps {
  variant?: TextVariant;
  color?: string;
  align?: TextStyle['textAlign'];
}

export function AppText({
  variant = 'body',
  color,
  align,
  style,
  children,
  ...rest
}: AppTextProps) {
  const { colors, fonts } = useTheme();

  const variantStyle: TextStyle = (() => {
    switch (variant) {
      case 'display':
        return {
          fontFamily: fonts.display,
          fontSize: 42,
          lineHeight: 47,
          letterSpacing: -1.2,
          color: colors.text,
        };
      case 'title':
        return {
          fontFamily: fonts.display,
          fontSize: 30,
          lineHeight: 36,
          letterSpacing: -0.6,
          color: colors.text,
        };
      case 'heading':
        return {
          fontFamily: fonts.display,
          fontSize: 23,
          lineHeight: 29,
          letterSpacing: -0.3,
          color: colors.text,
        };
      case 'subheading':
        return {
          fontFamily: fonts.semibold,
          fontSize: 17,
          lineHeight: 23,
          color: colors.text,
        };
      case 'body':
        return {
          fontFamily: fonts.body,
          fontSize: 16,
          lineHeight: 25,
          color: colors.text,
        };
      case 'bodySmall':
        return {
          fontFamily: fonts.body,
          fontSize: 14,
          lineHeight: 21,
          color: colors.textSecondary,
        };
      case 'label':
        return {
          fontFamily: fonts.semibold,
          fontSize: 11,
          lineHeight: 15,
          letterSpacing: 1.4,
          textTransform: 'uppercase',
          color: colors.textTertiary,
        };
      case 'caption':
        return {
          fontFamily: fonts.body,
          fontSize: 12,
          lineHeight: 17,
          color: colors.textTertiary,
        };
      case 'button':
        return {
          fontFamily: fonts.semibold,
          fontSize: 15,
          lineHeight: 20,
          color: colors.text,
        };
      case 'quote':
        return {
          fontFamily: fonts.displayItalic,
          fontSize: 21,
          lineHeight: 30,
          color: colors.textSecondary,
        };
    }
  })();

  return (
    <Text
      {...rest}
      maxFontSizeMultiplier={variant === 'display' || variant === 'title' ? 1.35 : 1.8}
      style={[
        variantStyle,
        color ? { color } : null,
        align ? { textAlign: align } : null,
        style,
      ]}>
      {children}
    </Text>
  );
}
