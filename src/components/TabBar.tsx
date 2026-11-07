import { Feather } from '@expo/vector-icons';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FONTS } from '@/theme/colors';
import { useTheme } from '@/theme/ThemeProvider';
import { AppText } from './ui/AppText';
import { PressableScale } from './ui/PressableScale';

const ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  index: 'book-open',
  books: 'grid',
  settings: 'settings',
};

const LABELS: Record<string, string> = {
  index: 'Journal',
  books: 'Books',
  settings: 'Settings',
};

export function FloatingTabBar({
  state,
  descriptors,
  emitter,
  navigateToTab,
}: BottomTabBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={[styles.outer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View
        style={[
          styles.bar,
          {
            backgroundColor: colors.tabBar,
            borderColor: colors.border,
            shadowColor: colors.shadow,
          },
        ]}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const options = descriptors[route.key]?.options;
          const label = LABELS[route.name] ?? options?.title ?? route.name;
          const icon = ICONS[route.name] ?? 'circle';

          return (
            <PressableScale
              key={route.key}
              accessibilityRole="tab"
              accessibilityLabel={label}
              accessibilityState={{ selected: focused }}
              onPress={() => {
                const event = emitter.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!focused && !event.defaultPrevented) {
                  navigateToTab(route.key);
                }
              }}
              onLongPress={() => emitter.emit({ type: 'tabLongPress', target: route.key })}
              haptic="light"
              scaleTo={0.95}
              style={[styles.tab, focused ? { backgroundColor: colors.accentSoft } : null]}>
              <Feather
                name={icon}
                size={19}
                color={focused ? colors.accent : colors.textTertiary}
              />
              <AppText
                variant="caption"
                style={[
                  styles.label,
                  {
                    color: focused ? colors.accent : colors.textTertiary,
                    fontFamily: focused ? FONTS.semibold : FONTS.medium,
                  },
                ]}>
                {label}
              </AppText>
            </PressableScale>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingHorizontal: 14,
    zIndex: 20,
  },
  bar: {
    width: '100%',
    maxWidth: 430,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 26,
    borderWidth: StyleSheet.hairlineWidth,
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: Platform.OS === 'android' ? 0 : 0.13,
    shadowRadius: 22,
    elevation: 12,
  },
  tab: {
    flex: 1,
    minHeight: 52,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  label: {
    fontSize: 10.5,
    lineHeight: 14,
    letterSpacing: 0.15,
  },
});
