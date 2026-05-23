// app/(tabs)/settings.tsx

import { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Modal, Animated, Vibration, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { useThemeStore, THEME_LIST, ThemeName, Typography, Spacing, Radius } from '../../src/theme';
import { verifyPin } from '../../src/services/authService';
import { useStore } from '../../src/store/useStore';
import { ConvCard } from '../../src/components';
import { Conversation } from '../../src/services/types';

const KEYS = [1,2,3,4,5,6,7,8,9,'',0,'⌫'] as const;

// ─── PIN Modal ────────────────────────────────────────────────────────────────
function PinModal({ visible, onClose, onSuccess, Colors }: {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  Colors: any;
}) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const shakeAnim = useRef(new Animated.Value(0)).current;

  function shake() {
    Vibration.vibrate(150);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8,  duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6,  duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,  duration: 55, useNativeDriver: true }),
    ]).start();
  }

  function handleClose() {
    setPin(''); setError(''); onClose();
  }

  async function onKey(k: number | string) {
    if (k === '⌫') { setPin((p) => p.slice(0, -1)); setError(''); return; }
    if (k === '' || pin.length >= 4) return;
    const np = pin + String(k);
    setPin(np);
    setError('');
    if (np.length < 4) return;

    const ok = await verifyPin(np);
    if (ok) {
      setPin(''); setError('');
      onSuccess();
    } else {
      setError('Wrong PIN. Try again.');
      shake();
      setTimeout(() => setPin(''), 500);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={pinStyles.backdrop}>
        <View style={[pinStyles.card, { backgroundColor: Colors.surface, borderColor: Colors.border }]}>
          <Text style={[Typography.headingL, { color: Colors.textPrimary, marginBottom: 4 }]}>
            Enter PIN
          </Text>
          {error
            ? <Text style={{ color: Colors.red, fontFamily: 'Sora_400Regular', fontSize: 12, marginBottom: 12 }}>{error}</Text>
            : <View style={{ height: 20 }} />
          }
          <Animated.View style={[pinStyles.dots, { transform: [{ translateX: shakeAnim }] }]}>
            {[0,1,2,3].map((i) => (
              <View key={i} style={[
                pinStyles.dot,
                { backgroundColor: Colors.border, borderColor: Colors.border },
                i < pin.length && { backgroundColor: Colors.neonBlue, borderColor: Colors.neonBlue },
              ]} />
            ))}
          </Animated.View>
          <View style={pinStyles.grid}>
            {KEYS.map((k, idx) => (
              <TouchableOpacity
                key={idx}
                style={[pinStyles.key, { backgroundColor: Colors.surfaceVariant, borderColor: Colors.border }, k === '' && pinStyles.keyEmpty]}
                onPress={() => k !== '' && onKey(k)}
                disabled={k === ''}
                activeOpacity={k === '' ? 1 : 0.6}
              >
                {k !== '' && <Text style={[pinStyles.keyText, { color: Colors.textPrimary }]}>{k}</Text>}
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity onPress={handleClose} style={{ marginTop: 20, paddingVertical: 8 }}>
            <Text style={{ color: Colors.textMuted, fontFamily: 'Sora_400Regular', fontSize: 13 }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Hidden Vault Screen ──────────────────────────────────────────────────────
function HiddenVault({ Colors, onClose }: { Colors: any; onClose: () => void }) {
  const { hiddenConversations, loadHiddenConversations, unhideConversation, removeConversation } = useStore();

  useState(() => { loadHiddenConversations(); });

  return (
    <View style={[vaultStyles.root, { backgroundColor: Colors.background }]}>
      <View style={[vaultStyles.header, { borderBottomColor: Colors.border }]}>
        <TouchableOpacity onPress={onClose}>
          <Text style={{ color: Colors.neonBlue, fontFamily: 'Sora_600SemiBold', fontSize: 14 }}>← Back</Text>
        </TouchableOpacity>
        <Text style={[Typography.headingL, { color: Colors.textPrimary }]}>🔒 Hidden Vault</Text>
        <View style={{ width: 60 }} />
      </View>

      <FlashList
        data={hiddenConversations}
        estimatedItemSize={110}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: Spacing.xl, paddingBottom: 40 }}
        renderItem={({ item }: { item: Conversation }) => (
          <View>
            <ConvCard
              conversation={item}
              onPress={() => {}}
              onStar={() => {}}
            />
            <View style={vaultStyles.actions}>
              <TouchableOpacity
                style={[vaultStyles.actionBtn, { borderColor: Colors.neonBlue }]}
                onPress={() => unhideConversation(item.id)}
              >
                <Text style={{ color: Colors.neonBlue, fontFamily: 'Sora_600SemiBold', fontSize: 12 }}>
                  Unhide
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[vaultStyles.actionBtn, { borderColor: Colors.red }]}
                onPress={() =>
                  Alert.alert('Delete', 'Delete this conversation permanently?', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => removeConversation(item.id) },
                  ])
                }
              >
                <Text style={{ color: Colors.red, fontFamily: 'Sora_600SemiBold', fontSize: 12 }}>
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>🔒</Text>
            <Text style={{ color: Colors.textMuted, fontFamily: 'Sora_400Regular', fontSize: 13 }}>
              No hidden conversations
            </Text>
          </View>
        }
      />
    </View>
  );
}

// ─── Settings Screen ──────────────────────────────────────────────────────────
export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { Colors, themeName, setTheme } = useThemeStore();
  const [showPinModal, setShowPinModal] = useState(false);
  const [showVault, setShowVault] = useState(false);

  if (showVault) {
    return <HiddenVault Colors={Colors} onClose={() => setShowVault(false)} />;
  }

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: Colors.background }]}
      contentContainerStyle={{ paddingTop: insets.top + Spacing.lg, paddingBottom: 100 }}
    >
      <Text style={[Typography.displayM, { color: Colors.textPrimary, paddingHorizontal: Spacing.xl, marginBottom: Spacing.xxl }]}>
        Settings
      </Text>

      {/* Appearance */}
      <Text style={[styles.section, { color: Colors.textMuted }]}>APPEARANCE</Text>
      {THEME_LIST.map((t) => (
        <TouchableOpacity
          key={t.name}
          style={[
            styles.row,
            { backgroundColor: Colors.surface, borderColor: themeName === t.name ? Colors.neonBlue : Colors.border },
          ]}
          onPress={() => setTheme(t.name as ThemeName)}
          activeOpacity={0.7}
        >
          <Text style={styles.rowIcon}>{t.emoji}</Text>
          <Text style={[styles.rowLabel, { color: Colors.textPrimary }]}>{t.label}</Text>
          {themeName === t.name && (
            <Text style={{ color: Colors.neonBlue, fontFamily: 'Sora_700Bold', fontSize: 16 }}>✓</Text>
          )}
        </TouchableOpacity>
      ))}

      {/* Security */}
      <Text style={[styles.section, { color: Colors.textMuted }]}>SECURITY</Text>
      <TouchableOpacity
        style={[styles.row, { backgroundColor: Colors.surface, borderColor: Colors.border }]}
        onPress={() => setShowPinModal(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.rowIcon}>🔒</Text>
        <Text style={[styles.rowLabel, { color: Colors.textPrimary }]}>Hidden Vault</Text>
        <Text style={{ color: Colors.textMuted, fontFamily: 'Sora_400Regular', fontSize: 12 }}>PIN protected ›</Text>
      </TouchableOpacity>

      {/* App */}
      <Text style={[styles.section, { color: Colors.textMuted }]}>APP</Text>
      <View style={[styles.row, { backgroundColor: Colors.surface, borderColor: Colors.border }]}>
        <Text style={styles.rowIcon}>🌙</Text>
        <Text style={[styles.rowLabel, { color: Colors.textPrimary }]}>AnVy</Text>
        <Text style={{ color: Colors.textMuted, fontFamily: 'Sora_400Regular', fontSize: 12 }}>v1.0.0</Text>
      </View>
      <View style={[styles.row, { backgroundColor: Colors.surface, borderColor: Colors.border }]}>
        <Text style={styles.rowIcon}>📦</Text>
        <Text style={[styles.rowLabel, { color: Colors.textPrimary }]}>Storage</Text>
        <Text style={{ color: Colors.textMuted, fontFamily: 'Sora_400Regular', fontSize: 12 }}>Offline · Private</Text>
      </View>

      {/* PIN Modal */}
      <PinModal
        visible={showPinModal}
        onClose={() => setShowPinModal(false)}
        Colors={Colors}
        onSuccess={() => {
          setShowPinModal(false);
          setShowVault(true);
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  section: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 11,
    letterSpacing: 1.5,
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.xxl,
    marginBottom: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    borderWidth: 1,
    borderRadius: Radius.lg,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.sm,
    gap: 12,
  },
  rowIcon: { fontSize: 20 },
  rowLabel: { flex: 1, fontFamily: 'Sora_600SemiBold', fontSize: 14 },
});

const pinStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#000000AA', alignItems: 'center', justifyContent: 'center' },
  card: { width: 320, borderRadius: Radius.xxl, borderWidth: 1, padding: Spacing.xxl, alignItems: 'center' },
  dots: { flexDirection: 'row', gap: 16, marginBottom: 28 },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 1 },
  grid: { width: 240, flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  key: { width: 68, height: 52, borderRadius: Radius.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  keyEmpty: { backgroundColor: 'transparent', borderColor: 'transparent' },
  keyText: { fontSize: 20, fontFamily: 'Sora_600SemiBold' },
});

const vaultStyles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.xl, paddingTop: 60, borderBottomWidth: 1 },
  actions: { flexDirection: 'row', gap: 8, paddingHorizontal: 4, marginTop: -8, marginBottom: 12 },
  actionBtn: { flex: 1, borderWidth: 1, borderRadius: Radius.md, paddingVertical: 8, alignItems: 'center' },
});
