// app/_layout.tsx

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { useFonts } from 'expo-font';
import {
  Sora_400Regular,
  Sora_600SemiBold,
  Sora_700Bold,
  Sora_800ExtraBold,
} from '@expo-google-fonts/sora';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useColors, useThemeStore } from '../src/theme';

SplashScreen.preventAutoHideAsync();

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  false,
  }),
});

export default function RootLayout() {
  const C            = useColors();
  const { loadTheme } = useThemeStore();

  const [fontsLoaded, fontError] = useFonts({
    Sora_400Regular,
    Sora_600SemiBold,
    Sora_700Bold,
    Sora_800ExtraBold,
  });

  useEffect(() => {
    // Load saved theme on startup
    loadTheme();

    // Request notification permissions
    (async () => {
      try {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          console.log('Notification permission not granted');
        }
      } catch (e) {
        console.error('Notification permission error:', e);
      }
    })();
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar
        style={C.background === '#F5F7FA' ? 'dark' : 'light'}
        backgroundColor={C.background}
      />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: C.background },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="lock" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="detail/[id]" options={{ animation: 'slide_from_right' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
