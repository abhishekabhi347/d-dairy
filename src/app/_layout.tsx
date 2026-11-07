import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import {
  Fraunces_400Regular,
  Fraunces_600SemiBold,
  Fraunces_600SemiBold_Italic,
} from '@expo-google-fonts/fraunces';
import { Feather } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect, useState, type PropsWithChildren } from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { AppProvider, useApp } from '@/context/AppProvider';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { FONTS } from '@/theme/colors';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

function LoadingScreen({ fontsReady }: { fontsReady: boolean }) {
  const { colors } = useTheme();
  const { status } = useApp();
  const reducedMotion = useReducedMotion();
  const [fade] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (reducedMotion) {
      fade.setValue(1);
      return;
    }
    Animated.timing(fade, {
      toValue: 1,
      duration: 500,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [fade, reducedMotion]);

  return (
    <View style={[styles.loading, { backgroundColor: colors.background }]}>
      <Animated.View style={[styles.loadingInner, { opacity: fade }]}>
        <View style={[styles.mark, { backgroundColor: colors.accentSoft }]}>
          <Feather name="feather" size={26} color={colors.accent} />
        </View>
        <AppText variant="title" style={{ fontFamily: FONTS.display }}>
          ddairy
        </AppText>
        <AppText variant="bodySmall" align="center">
          {status === 'loading' || !fontsReady ? 'Opening your pages…' : 'Ready when you are.'}
        </AppText>
      </Animated.View>
    </View>
  );
}

function AppGate({ fontsReady, children }: PropsWithChildren<{ fontsReady: boolean }>) {
  const { status } = useApp();
  const { colors, scheme } = useTheme();
  const ready = status === 'ready' && fontsReady;

  useEffect(() => {
    if (Platform.OS !== 'web') {
      SystemUI.setBackgroundColorAsync(colors.background).catch(() => undefined);
    }
  }, [colors.background]);

  useEffect(() => {
    if (!ready) return;
    SplashScreen.hideAsync().catch(() => undefined);
  }, [ready]);

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      {ready ? (
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: 'slide_from_right',
          }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="entry/[id]"
            options={{
              animation: 'slide_from_bottom',
              gestureEnabled: true,
            }}
          />
        </Stack>
      ) : (
        <LoadingScreen fontsReady={fontsReady} />
      )}
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Fraunces_400Regular,
    Fraunces_600SemiBold,
    Fraunces_600SemiBold_Italic,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
  });

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <AppProvider>
          <ThemeProvider>
            <AppGate fontsReady={fontsLoaded || Boolean(fontError)}>
              <View style={styles.flex} />
            </AppGate>
          </ThemeProvider>
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingInner: {
    alignItems: 'center',
    gap: 10,
  },
  mark: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
});
