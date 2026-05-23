// app/index.tsx
// Splash screen → converted from Flutter SplashScreen StatefulWidget

import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography } from '../src/theme';

export default function SplashRoute() {
  const scale = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animation (Flutter: CurvedAnimation elasticOut + fade)
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();

    // Breathing glow loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ])
    ).start();

    // Navigate to lock after splash
    const timer = setTimeout(() => {
      router.replace('/lock');
    }, 2400);
    return () => clearTimeout(timer);
  }, []);

  const glowScale = glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.content, { opacity, transform: [{ scale }] }]}>
        <Animated.View style={{ transform: [{ scale: glowScale }] }}>
          <LinearGradient
            colors={['#0D2040', '#0A1628']}
            style={styles.iconBox}
          >
            <Text style={styles.icon}>🌙</Text>
          </LinearGradient>
        </Animated.View>

        <Text style={styles.appName}>AnVy</Text>
        <Text style={styles.tagline}>CONVERSATION MEMORY · PRIVATE</Text>

        <View style={styles.dots}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[styles.dot, i === 0 && styles.dotActive]}
            />
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
  },
  iconBox: {
    width: 96,
    height: 96,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.neonBlue + '44',
    shadowColor: Colors.neonBlue,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
    marginBottom: 24,
  },
  icon: { fontSize: 44 },
  appName: {
    ...Typography.displayXL,
    color: Colors.textPrimary,
  },
  tagline: {
    ...Typography.label,
    color: Colors.textMuted,
    marginTop: 8,
    letterSpacing: 3,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 48,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.border,
  },
  dotActive: {
    backgroundColor: Colors.neonBlue,
  },
});
