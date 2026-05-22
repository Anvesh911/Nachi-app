// app/(tabs)/_layout.tsx
// Tab navigator - converted from Flutter BottomAppBar + FloatingActionButton

import { useState } from 'react';
import { Tabs } from 'expo-router';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
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
      </Tabs>

      {/* Recording modal - converted from Flutter showModalBottomSheet */}
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

function CustomTabBar({
  state,
  descriptors,
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

      {/* FAB - Record (converted from Flutter FloatingActionButton) */}
      <TouchableOpacity onPress={onRecord} style={styles.fab}>
        <View style={styles.fabInner}>
          <Text style={{ fontSize: 26 }}>🎙️</Text>
        </View>
      </TouchableOpacity>

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
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
});
