import { useEffect, useState, type PropsWithChildren } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useResponsive } from '@/hooks/useResponsive';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useTheme } from '@/theme/ThemeProvider';
import { AppText } from './AppText';
import { IconButton } from './IconButton';

interface SheetModalProps extends PropsWithChildren {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  variant?: 'bottom' | 'center';
  contentStyle?: StyleProp<ViewStyle>;
  testID?: string;
}

export function SheetModal({
  visible,
  onClose,
  title,
  subtitle,
  variant = 'bottom',
  contentStyle,
  testID,
  children,
}: SheetModalProps) {
  const { colors } = useTheme();
  const { isTablet } = useResponsive();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!visible) {
      progress.setValue(0);
      return;
    }
    if (reducedMotion) {
      progress.setValue(1);
      return;
    }
    Animated.spring(progress, {
      toValue: 1,
      useNativeDriver: Platform.OS !== 'web',
      damping: 22,
      stiffness: 220,
      mass: 0.8,
    }).start();
  }, [progress, reducedMotion, visible]);

  const alignCenter = variant === 'center' || isTablet;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
      presentationStyle="overFullScreen">
      <View
        testID={testID}
        accessibilityViewIsModal
        style={[styles.root, { justifyContent: alignCenter ? 'center' : 'flex-end' }]}>
        <Pressable
          accessibilityLabel="Close"
          onPress={onClose}
          style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }]}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          pointerEvents="box-none"
          style={styles.keyboardView}>
          <Animated.View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                paddingBottom: Math.max(insets.bottom, 18),
                opacity: progress,
                transform: [
                  {
                    translateY: progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [40, 0],
                    }),
                  },
                ],
              },
              contentStyle,
            ]}>
            <View style={styles.handleWrap}>
              <View style={[styles.handle, { backgroundColor: colors.borderStrong }]} />
            </View>
            {title || subtitle ? (
              <View style={styles.header}>
                <View style={styles.headerText}>
                  {title ? <AppText variant="heading">{title}</AppText> : null}
                  {subtitle ? (
                    <AppText variant="bodySmall" style={styles.subtitle}>
                      {subtitle}
                    </AppText>
                  ) : null}
                </View>
                <IconButton
                  icon="x"
                  accessibilityLabel="Close"
                  variant="surface"
                  onPress={onClose}
                  size={38}
                  iconSize={18}
                />
              </View>
            ) : null}
            <ScrollView
              bounces={false}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}>
              {children}
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 10,
  },
  keyboardView: {
    width: '100%',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 580,
    maxHeight: '90%',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 28,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.14,
    shadowRadius: 30,
    elevation: 16,
  },
  handleWrap: {
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 8,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    opacity: 0.6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 8,
    gap: 12,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  subtitle: {
    maxWidth: 420,
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
});
