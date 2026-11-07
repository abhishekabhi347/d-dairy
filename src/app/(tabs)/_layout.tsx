import { Tabs } from 'expo-router/js-tabs';

import { FloatingTabBar } from '@/components/TabBar';
import { useTheme } from '@/theme/ThemeProvider';

export default function TabsLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      backBehavior="history"
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Journal' }} />
      <Tabs.Screen name="books" options={{ title: 'Books' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
