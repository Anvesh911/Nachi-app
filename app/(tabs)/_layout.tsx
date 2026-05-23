// app/(tabs)/_layout.tsx
// Tab navigator - converted from Flutter BottomAppBar + FloatingActionButton

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
import { Colors, Radius } from '../../src/theme';
import RecordingSheet from '../../src/screens/RecordingSheet';

export default function TabsLayout() {
  const [showRecord, setShowRecord] = useState(false);

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: Colors.neonBlue,
          tabBarInactiveTintColor: Colors.textMuted,
          tabBarLabelStyle: {
            fontFamily: 'Sora_600SemiBold',
            fontSize: 10,
            letterSpacing: 0.5,
          },
        }}
        tabBar={(props) => <CustomTabBar {...props} onRecord={() => setShowRecord(true)} />}
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

function MoonFAB({ onPress }: { onPress: () => void }) {
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
          { opacity: glowOpacity, transform: [{ scale: glowScale }] },
        ]}
      />
      <View style={styles.fabInner}>
        <Text style={{ fontSize: 26 }}>🌙</Text>
      </View>
    </TouchableOpacity>
  );
}

function CustomTabBar({
  state,
  navigation,
  onRecord,
}: any & { onRecord: () => void }) {
  return (
    <View style={styles.tabBarContainer}>
      {/* Home tab */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => navigation.navigate(state.routes[0].name)}
      >
        <Text style={{ fontSize: 22, opacity: state.index === 0 ? 1 : 0.35 }}>🏠</Text>
        <Text style={[styles.tabLabel, state.index === 0 && styles.tabLabelActive]}>
          Home
        </Text>
      </TouchableOpacity>

      {/* Moon FAB */}
      <MoonFAB onPress={onRecord} />

      {/* Starred tab */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => navigation.navigate(state.routes[1].name)}
      >
        <Text style={{ fontSize: 22, opacity: state.index === 1 ? 1 : 0.35 }}>⭐</Text>
        <Text style={[styles.tabLabel, state.index === 1 && styles.tabLabelActive]}>
          Starred
        </Text>
      </TouchableOpacity>

      {/* Settings tab */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => navigation.navigate(state.routes[2].name)}
      >
        <Text style={{ fontSize: 22, opacity: state.index === 2 ? 1 : 0.35 }}>⚙️</Text>
        <Text style={[styles.tabLabel, state.index === 2 && styles.tabLabelActive]}>
          Settings
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.background,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    height: 72,
    paddingBottom: 8,
  },
  tabBarContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    height: 80,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 12,
    paddingHorizontal: 20,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: 'Sora_600SemiBold',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  tabLabelActive: { color: Colors.neonBlue },
  fab: {
    marginTop: -28,
    alignItems: 'center',
    justifyContent: 'center',
    width: 72,
    height: 72,
  },
  fabGlow: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.neonBlue + '33',
    borderWidth: 1,
    borderColor: Colors.neonBlue + '66',
  },
  fabInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.neonBlue,
    shadowColor: Colors.neonBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 12,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: '#00000088',
  },
});
