import { Feather } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { AppText } from './AppText';
import { Button } from './Button';

type FeatherName = ComponentProps<typeof Feather>['name'];

interface EmptyStateProps {
  icon?: FeatherName;
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: FeatherName;
  secondaryLabel?: string;
  onSecondary?: () => void;
}

export function EmptyState({
  icon = 'feather',
  title,
  body,
  actionLabel,
  onAction,
  actionIcon = 'mic',
  secondaryLabel,
  onSecondary,
}: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}>
      <View style={[styles.orbit, { borderColor: colors.border, backgroundColor: colors.surfaceTint }]}>
        <View style={[styles.innerCircle, { backgroundColor: colors.accentSoft }]}>
          <Feather name={icon} size={24} color={colors.accent} />
        </View>
      </View>
      <View style={styles.copy}>
        <AppText variant="heading" align="center">
          {title}
        </AppText>
        <AppText variant="bodySmall" align="center" style={styles.body}>
          {body}
        </AppText>
      </View>
      {actionLabel && onAction ? (
        <View style={styles.actions}>
          <Button label={actionLabel} onPress={onAction} icon={actionIcon} />
          {secondaryLabel && onSecondary ? (
            <Button label={secondaryLabel} onPress={onSecondary} variant="ghost" icon="edit-3" />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 24,
    borderRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 18,
  },
  orbit: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    alignItems: 'center',
    gap: 8,
    maxWidth: 380,
  },
  body: {
    maxWidth: 340,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
});
