import { forwardRef } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { AppText } from './AppText';

interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string | null;
  hint?: string;
  containerStyle?: StyleProp<ViewStyle>;
  trailing?: React.ReactNode;
}

export const TextField = forwardRef<React.ComponentRef<typeof TextInput>, TextFieldProps>(function TextField(
  { label, error, hint, containerStyle, style, trailing, ...rest },
  ref,
) {
  const { colors, fonts } = useTheme();

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <AppText variant="label">{label}</AppText> : null}
      <View
        style={[
          styles.inputWrap,
          {
            backgroundColor: colors.surfaceRaised,
            borderColor: error ? colors.danger : colors.border,
          },
        ]}>
        <TextInput
          ref={ref}
          {...rest}
          placeholderTextColor={colors.placeholder}
          selectionColor={colors.accent}
          style={[
            styles.input,
            { color: colors.text, fontFamily: fonts.body },
            style,
          ]}
        />
        {trailing}
      </View>
      {error ? (
        <AppText variant="caption" style={{ color: colors.danger }}>
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="caption">{hint}</AppText>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    gap: 7,
  },
  inputWrap: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 15,
    paddingHorizontal: 14,
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    paddingVertical: 12,
  },
});
