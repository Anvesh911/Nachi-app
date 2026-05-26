// app/(tabs)/_layout.tsx

import { useState, useRef, useEffect } from 'react';
import { Tabs } from 'expo-router';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Modal, Animated,
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { useColors, Radius } from '../../src/theme';
import RecordingSheet from '../../src/screens/RecordingSheet';

function HomeIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M3 12L12 3l9 9" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

function StarIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

function PersonIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={8} r={4} stroke={color} strokeWidth={2}/>
      <Path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={color} strokeWidth={2} strokeLinecap="round"/>
    </Svg>
  );
}

function MicIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3C10.3 3 9 4.3 9 6v7c0 1.7 1.3 3 3 3s3-1.3 3-3V6c0-1.7-1.3-3-3-3z" stroke="white" strokeWidth={2}/>
      <Path d="M5 11c0 3.9 3.1 7 7 7s7-3.1 7-7" stroke="white" strokeWidth={2} strokeLinecap="round"/>
      <Path d="M12 18v3M9 21h6" stroke="white" strokeWidth={2} strokeLinecap="round"/>
    </Svg>
  );
}

function FAB({ onPress }: { onPress: () => void }) {
  const C = useColors();
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, { toValue: 1.12, duration: 1000, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.15, duration: 1000, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scale, { toValue: 1, duration: 1000, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.6, duration: 1000, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);

  return (
    <TouchableOpacity onPress={onPress} style={styles.fabWrap} activeOpacity={0.85}>
      <Animated.View style={[
        styles.fabRing,
        { borderColor: C.purple + '4D', transform: [{ scale }], opacity },
      ]} />
      <View style={[styles.fabInner, {
        shadowColor: C.purple,
      }]}>
        <MicIcon />
      </View>
    </TouchableOpacity>
  );
}

function CustomTabBar({ state, navigation, onRecord }: any) {
  const C = useColors();

  const tabs = [
    { name: state.routes[0].name, label: 'Home', Icon: HomeIcon },
    { name: 'fab', label: '', Icon: null },
    { name: state.routes[1].name, label: 'Starred', Icon: StarIcon },
    { name: state.routes[2].name, label: 'Settings', Icon: PersonIcon },
  ];

  return (
    <View style={[styles.tabBar, {
      backgroundColor: C.surface,
      borderTopColor: C.border,
      shadowColor: C.purple,
    }]}>
      {tabs.map((tab, i) => {
        if (tab.name === 'fab') {
          return <FAB key="fab" onPress={onRecord} />;
        }

        const routeIndex = i > 1 ? i - 1 : i;
        const isActive = state.index === routeIndex;
        const color = isActive ? C.purple : C.textMuted;

        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tabItem}
            onPress={() => navigation.navigate(tab.name)}
            activeOpacity={0.7}
          >
            <View style={styles.tabIcon}>
              {tab.Icon && <tab.Icon color={color} />}
            </View>
            <Text style={[styles.tabLabel, { color }]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  const [showRecord, setShowRecord] = useState(false);

  return (
    <>
      <Tabs
        screenOptions={{ headerShown: false }}
        tabBar={(props) => (
          <CustomTabBar {...props} onRecord={() => setShowRecord(true)} />
        )}
      >
        <Tabs.Screen name="index" options={{ title: 'Home' }} />
        <Tabs.Screen name="starred" options={{ title: 'Starred' }} />
        <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
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

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1.5,
    height: 72,
    alignItems: 'flex-start',
    paddingTop: 8,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 12,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  tabIcon: {
    width: 26, height: 26,
    alignItems: 'center', justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 9,
    fontFamily: 'Nunito_700Bold',
    letterSpacing: 0.5,
  },
  fabWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: -24,
  },
  fabRing: {
    position: 'absolute',
    top: -6, left: '50%',
    marginLeft: -35,
    width: 70, height: 70,
    borderRadius: 35,
    borderWidth: 1.5,
  },
  fabInner: {
    width: 58, height: 58,
    borderRadius: 29,
    backgroundColor: '#7C4DFF',
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: '#00000088',
  },
});
