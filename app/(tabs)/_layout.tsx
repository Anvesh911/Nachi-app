// app/(tabs)/_layout.tsx

import { useState, useRef, useEffect } from 'react';
import { Tabs } from 'expo-router';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
} from 'react-native';
import { useColors, Radius } from '../../src/theme';
import RecordingSheet from '../../src/screens/RecordingSheet';

export default function TabsLayout() {
  const [showRecord, setShowRecord] = useState(false);
  const C = useColors();

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: C.background,
            borderTopColor: C.border,
            borderTopWidth: 1,
            height: 72,
            paddingBottom: 8,
          },
          tabBarActiveTintColor: C.neonBlue,
          tabBarInactiveTintColor: C.textMuted,
          tabBarLabelStyle: {
            fontFamily: 'Sora_600SemiBold',
            fontSize: 10,
            letterSpacing: 0.5,
          },
        }}
        tabBar={(props) => (
          <CustomTabBar {...props} onRecord={() => setShowRecord(true)} />
        )}
      >
        <Tabs.Screen
          name="index"
          options={{ title: 'Home', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🏠</Text> }}
        />
        <Tabs.Screen
          name="starred"
          options={{ title: 'Starred', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>⭐</Text> }}
        />
        <Tabs.Screen
          name="settings"
          options={{ title: 'Settings', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>⚙️</Text> }}
        />
      </Tabs>

      <Modal
        visible={showRecord}
        animationType="slide"
        transparent
        onRequestClose={() => setShowRecord(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setShowRecord(false)}
          />
          <RecordingSheet onClose={() => setShowRecord(false)} />
        </View>
      </Modal>
    </>
  );
}

// ─── Moon FAB ─────────────────────────────────────────────────────────────────
function MoonFAB({ onPress }: { onPress: () => void }) {
  const C    = useColors();
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.9] });
  const glowScale   = glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.2] });

  return (
    <TouchableOpacity onPress={onPress} style={styles.fab} activeOpacity={0.85}>
      <Animated.View
        style={[
          styles.fabGlow,
          {
            backgroundColor: C.neonBlue + '33',
            borderColor: C.neonBlue + '66',
            opacity: glowOpacity,
            transform: [{ scale: glowScale }],
          },
        ]}
      />
      <View style={[styles.fabInner, { backgroundColor: C.neonBlue, shadowColor: C.neonBlue }]}>
        <Text style={{ fontSize: 26 }}>🌙</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Custom Tab Bar ───────────────────────────────────────────────────────────
function CustomTabBar({ state, navigation, onRecord }: any & { onRecord: () => void }) {
  const C = useColors();

  return (
    <View style={[styles.tabBarContainer, { backgroundColor: C.background, borderTopColor: C.border }]}>
      {/* Home */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => navigation.navigate(state.routes[0].name)}
      >
        <Text style={{ fontSize: 22, opacity: state.index === 0 ? 1 : 0.35 }}>🏠</Text>
        <Text style={[styles.tabLabel, { color: state.index === 0 ? C.neonBlue : C.textMuted }]}>
          Home
        </Text>
      </TouchableOpacity>

      {/* Moon FAB */}
      <MoonFAB onPress={onRecord} />

      {/* Starred */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => navigation.navigate(state.routes[1].name)}
      >
        <Text style={{ fontSize: 22, opacity: state.index === 1 ? 1 : 0.35 }}>⭐</Text>
        <Text style={[styles.tabLabel, { color: state.index === 1 ? C.neonBlue : C.textMuted }]}>
          Starred
        </Text>
      </TouchableOpacity>

      {/* Settings */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => navigation.navigate(state.routes[2].name)}
      >
        <Text style={{ fontSize: 22, opacity: state.index === 2 ? 1 : 0.35 }}>⚙️</Text>
        <Text style={[styles.tabLabel, { color: state.index === 2 ? C.neonBlue : C.textMuted }]}>
          Settings
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    height: 80,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 12,
    paddingHorizontal: 20,
  },
  tabItem: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 8 },
  tabLabel: { fontSize: 10, fontFamily: 'Sora_600SemiBold', letterSpacing: 0.5 },
  fab: { marginTop: -28, alignItems: 'center', justifyContent: 'center', width: 72, height: 72 },
  fabGlow: { position: 'absolute', width: 72, height: 72, borderRadius: 36, borderWidth: 1 },
  fabInner: {
    width: 60, height: 60, borderRadius: 30,
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6, shadowRadius: 16, elevation: 12,
  },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000088' },
});
