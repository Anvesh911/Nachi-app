// app/(tabs)/settings.tsx

import { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Modal, Animated, Vibration, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import * as FileSystem from 'expo-file-system';
import { useColors, useThemeStore, THEME_LIST, ThemeName, Typography, Spacing, Radius, Shadow } from '../../src/theme';
import { verifyPin, savePin } from '../../src/services/authService';
import { useStore } from '../../src/store/useStore';
import { ConvCard } from '../../src/components';
import { Conversation } from '../../src/services/types';
import { getStorageInfo, clearAllTranscripts, deleteOldConversations } from '../../src/services/database';

const KEYS = [1,2,3,4,5,6,7,8,9,'',0,'⌫'] as const;

// ─── PIN Modal ────────────────────────────────────────────────────────────────
function PinModal({ visible, onClose, onSuccess, mode = 'verify' }: {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode?: 'verify' | 'change_current' | 'change_new' | 'change_confirm';
}) {
  const C = useColors();
  const [pin, setPin]     = useState('');
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

  function handleClose() { setPin(''); setError(''); onClose(); }

  async function onKey(k: number | string) {
    if (k === '⌫') { setPin((p) => p.slice(0, -1)); setError(''); return; }
    if (k === '' || pin.length >= 4) return;
    const np = pin + String(k);
    setPin(np);
    setError('');
    if (np.length < 4) return;

    const ok = await verifyPin(np);
    if (ok) { setPin(''); setError(''); onSuccess(); }
    else { setError('Wrong PIN. Try again.'); shake(); setTimeout(() => setPin(''), 500); }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={pinStyles.backdrop}>
        <View style={[pinStyles.card, {
          backgroundColor: C.surface,
          borderColor: C.border,
          ...Shadow.purple,
        }]}>
          <Text style={[Typography.headingL, { color: C.textPrimary, marginBottom: 4 }]}>Enter PIN</Text>
          {error
            ? <Text style={{ color: C.red, fontFamily: 'Sora_400Regular', fontSize: 12, marginBottom: 12 }}>{error}</Text>
            : <View style={{ height: 20 }} />
          }
          <Animated.View style={[pinStyles.dots, { transform: [{ translateX: shakeAnim }] }]}>
            {[0,1,2,3].map((i) => (
              <View key={i} style={[
                pinStyles.dot,
                { backgroundColor: C.border, borderColor: C.border },
                i < pin.length && { backgroundColor: C.purple, borderColor: C.purple },
              ]} />
            ))}
          </Animated.View>
          <View style={pinStyles.grid}>
            {KEYS.map((k, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  pinStyles.key,
                  { backgroundColor: C.surfaceVariant, borderColor: C.border },
                  k === '' && pinStyles.keyEmpty,
                ]}
                onPress={() => k !== '' && onKey(k)}
                disabled={k === ''}
                activeOpacity={k === '' ? 1 : 0.6}
              >
                {k !== '' && <Text style={[pinStyles.keyText, { color: C.textPrimary }]}>{k}</Text>}
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity onPress={handleClose} style={{ marginTop: 20, paddingVertical: 8 }}>
            <Text style={{ color: C.textMuted, fontFamily: 'Sora_400Regular', fontSize: 13 }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Change PIN Flow ──────────────────────────────────────────────────────────
function ChangePinFlow({ onClose }: { onClose: () => void }) {
  const C = useColors();
  const [step, setStep]           = useState<'current' | 'new' | 'confirm'>('current');
  const [newPinTemp, setNewPinTemp] = useState('');
  const [pin, setPin]             = useState('');
  const [error, setError]         = useState('');
  const shakeAnim = useRef(new Animated.Value(0)).current;

  function shake() {
    Vibration.vibrate(150);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8,  duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,  duration: 55, useNativeDriver: true }),
    ]).start();
  }

  async function onKey(k: number | string) {
    if (k === '⌫') { setPin((p) => p.slice(0, -1)); setError(''); return; }
    if (k === '' || pin.length >= 4) return;
    const np = pin + String(k);
    setPin(np);
    setError('');
    if (np.length < 4) return;

    if (step === 'current') {
      const ok = await verifyPin(np);
      if (ok) { setPin(''); setStep('new'); }
      else { setError('Wrong PIN'); shake(); setTimeout(() => setPin(''), 500); }
    } else if (step === 'new') {
      setNewPinTemp(np); setPin(''); setStep('confirm');
    } else {
      if (np === newPinTemp) {
        await savePin(np);
        Alert.alert('PIN Changed', 'Your PIN has been updated successfully.');
        onClose();
      } else {
        setError('PINs do not match');
        shake();
        setPin(''); setNewPinTemp(''); setStep('new');
      }
    }
  }

  const title = step === 'current' ? 'Current PIN' : step === 'new' ? 'New PIN' : 'Confirm PIN';

  return (
    <View style={[{ flex: 1, backgroundColor: C.background, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }]}>
      <TouchableOpacity onPress={onClose} style={{ position: 'absolute', top: 60, left: 20 }}>
        <Text style={{ color: C.purple, fontFamily: 'Sora_600SemiBold', fontSize: 14 }}>← Cancel</Text>
      </TouchableOpacity>
      <Text style={[Typography.headingL, { color: C.textPrimary, marginBottom: 8 }]}>Change PIN</Text>
      <Text style={[Typography.bodyM, { color: C.purple, marginBottom: 4 }]}>{title}</Text>
      {error
        ? <Text style={{ color: C.red, fontFamily: 'Sora_400Regular', fontSize: 12, marginBottom: 12 }}>{error}</Text>
        : <View style={{ height: 20 }} />
      }
      <Animated.View style={[pinStyles.dots, { transform: [{ translateX: shakeAnim }] }]}>
        {[0,1,2,3].map((i) => (
          <View key={i} style={[
            pinStyles.dot,
            { backgroundColor: C.border, borderColor: C.border },
            i < pin.length && { backgroundColor: C.purple, borderColor: C.purple },
          ]} />
        ))}
      </Animated.View>
      <View style={pinStyles.grid}>
        {KEYS.map((k, idx) => (
          <TouchableOpacity
            key={idx}
            style={[
              pinStyles.key,
              { backgroundColor: C.surface, borderColor: C.border },
              k === '' && pinStyles.keyEmpty,
            ]}
            onPress={() => k !== '' && onKey(k)}
            disabled={k === ''}
            activeOpacity={k === '' ? 1 : 0.6}
          >
            {k !== '' && <Text style={[pinStyles.keyText, { color: C.textPrimary }]}>{k}</Text>}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── Storage Screen ───────────────────────────────────────────────────────────
function StorageScreen({ onClose }: { onClose: () => void }) {
  const C = useColors();
  const { loadConversations } = useStore();
  const [info, setInfo]   = useState({ conversationsCount: 0, remindersCount: 0, transcriptChars: 0 });
  const [recSize, setRecSize] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadInfo(); }, []);

  async function loadInfo() {
    setLoading(true);
    try {
      const dbInfo = await getStorageInfo();
      setInfo(dbInfo);
      const dir = FileSystem.documentDirectory + 'anvy_recordings/';
      try {
        const files = await FileSystem.readDirectoryAsync(dir);
        let total = 0;
        for (const f of files) {
          const info = await FileSystem.getInfoAsync(dir + f);
          if (info.exists && 'size' in info) total += (info as any).size ?? 0;
        }
        setRecSize(total);
      } catch (_) { setRecSize(0); }
    } catch (e) { console.error('loadInfo error:', e); }
    setLoading(false);
  }

  function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  async function handleClearTranscripts() {
    Alert.alert('Clear Transcripts', 'This will remove all transcript text. Recordings are kept.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear', style: 'destructive',
        onPress: async () => {
          await clearAllTranscripts();
          await loadConversations();
          await loadInfo();
          Alert.alert('Done', 'All transcripts cleared.');
        },
      },
    ]);
  }

  async function handleDeleteOldRecordings() {
    Alert.alert('Delete Old Recordings', 'Delete unstarred conversations older than 30 days?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          const cutoff = new Date();
          cutoff.setDate(cutoff.getDate() - 30);
          const count = await deleteOldConversations(cutoff.toISOString());
          await loadConversations();
          await loadInfo();
          Alert.alert('Done', `${count} old conversation(s) deleted.`);
        },
      },
    ]);
  }

  const transcriptBytes = info.transcriptChars * 2;

  return (
    <ScrollView
      style={[{ flex: 1, backgroundColor: C.background }]}
      contentContainerStyle={{ paddingBottom: 60 }}
    >
      <View style={[storageStyles.header, { borderBottomColor: C.border }]}>
        <TouchableOpacity onPress={onClose}>
          <Text style={{ color: C.purple, fontFamily: 'Sora_600SemiBold', fontSize: 14 }}>← Back</Text>
        </TouchableOpacity>
        <Text style={[Typography.headingL, { color: C.textPrimary }]}>Storage</Text>
        <View style={{ width: 60 }} />
      </View>

      <Text style={[styles.section, { color: C.textMuted, paddingHorizontal: Spacing.xl }]}>USAGE</Text>

      {[
        { label: 'Conversations', value: `${info.conversationsCount} saved`, icon: '💬' },
        { label: 'Reminders',     value: `${info.remindersCount} active`,   icon: '🔔' },
        { label: 'Transcripts',   value: formatBytes(transcriptBytes),       icon: '📝' },
        { label: 'Recordings',    value: formatBytes(recSize),               icon: '🎙️' },
      ].map((item) => (
        <View key={item.label} style={[styles.row, { backgroundColor: C.surface, borderColor: C.border }]}>
          <Text style={styles.rowIcon}>{item.icon}</Text>
          <Text style={[styles.rowLabel, { color: C.textPrimary }]}>{item.label}</Text>
          <Text style={{ color: C.textMuted, fontFamily: 'Sora_400Regular', fontSize: 12 }}>{item.value}</Text>
        </View>
      ))}

      <Text style={[styles.section, { color: C.textMuted, paddingHorizontal: Spacing.xl }]}>ACTIONS</Text>

      <TouchableOpacity
        style={[styles.row, { backgroundColor: C.surface, borderColor: C.border }]}
        onPress={loadInfo}
      >
        <Text style={styles.rowIcon}>🔄</Text>
        <Text style={[styles.rowLabel, { color: C.textPrimary }]}>Recalculate Storage</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.row, { backgroundColor: C.surface, borderColor: C.border }]}
        onPress={handleClearTranscripts}
      >
        <Text style={styles.rowIcon}>🗑</Text>
        <Text style={[styles.rowLabel, { color: C.red }]}>Clear All Transcripts</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.row, { backgroundColor: C.surface, borderColor: C.border }]}
        onPress={handleDeleteOldRecordings}
      >
        <Text style={styles.rowIcon}>📦</Text>
        <Text style={[styles.rowLabel, { color: C.red }]}>Delete Old Conversations (30d+)</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── Hidden Vault ─────────────────────────────────────────────────────────────
function HiddenVault({ onClose }: { onClose: () => void }) {
  const C = useColors();
  const { hiddenConversations, loadHiddenConversations, unhideConversation, removeConversation } = useStore();

  useState(() => { loadHiddenConversations(); });

  return (
    <View style={[vaultStyles.root, { backgroundColor: C.background }]}>
      <View style={[vaultStyles.header, { borderBottomColor: C.border }]}>
        <TouchableOpacity onPress={onClose}>
          <Text style={{ color: C.purple, fontFamily: 'Sora_600SemiBold', fontSize: 14 }}>← Back</Text>
        </TouchableOpacity>
        <Text style={[Typography.headingL, { color: C.textPrimary }]}>🔒 Hidden Vault</Text>
        <View style={{ width: 60 }} />
      </View>
      <FlashList
        data={hiddenConversations}
        estimatedItemSize={110}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: Spacing.xl, paddingBottom: 40 }}
        renderItem={({ item }: { item: Conversation }) => (
          <View>
            <ConvCard conversation={item} onPress={() => {}} onStar={() => {}} />
            <View style={vaultStyles.actions}>
              <TouchableOpacity
                style={[vaultStyles.actionBtn, { borderColor: C.purple }]}
                onPress={() => unhideConversation(item.id)}
              >
                <Text style={{ color: C.purple, fontFamily: 'Sora_600SemiBold', fontSize: 12 }}>Unhide</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[vaultStyles.actionBtn, { borderColor: C.red }]}
                onPress={() => Alert.alert('Delete', 'Delete permanently?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: () => removeConversation(item.id) },
                ])}
              >
                <Text style={{ color: C.red, fontFamily: 'Sora_600SemiBold', fontSize: 12 }}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <View style={[vaultStyles.emptyIconWrap, { backgroundColor: C.purplePale, borderColor: C.border }]}>
              <Text style={{ fontSize: 32 }}>🔒</Text>
            </View>
            <Text style={[vaultStyles.emptyTitle, { color: C.textPrimary }]}>No hidden conversations</Text>
            <Text style={{ color: C.textMuted, fontFamily: 'Sora_400Regular', fontSize: 13, textAlign: 'center' }}>
              Long-press any conversation{'\n'}on the home screen to hide it.
            </Text>
          </View>
        }
      />
    </View>
  );
}

// ─── Settings Screen ──────────────────────────────────────────────────────────
export default function SettingsScreen() {
  const insets                  = useSafeAreaInsets();
  const C                       = useColors();
  const { themeName, setTheme } = useThemeStore();
  const [showPinModal, setShowPinModal]   = useState(false);
  const [showVault, setShowVault]         = useState(false);
  const [showChangePin, setShowChangePin] = useState(false);
  const [showStorage, setShowStorage]     = useState(false);

  if (showVault)     return <HiddenVault onClose={() => setShowVault(false)} />;
  if (showChangePin) return <ChangePinFlow onClose={() => setShowChangePin(false)} />;
  if (showStorage)   return <StorageScreen onClose={() => setShowStorage(false)} />;

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: C.background }]}
      contentContainerStyle={{ paddingTop: insets.top + Spacing.lg, paddingBottom: 100 }}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.eyebrow, { color: C.textMuted }]}>PREFERENCES</Text>
        <Text style={[Typography.displayM, { color: C.textPrimary }]}>
          Settings
        </Text>
      </View>

      {/* Appearance */}
      <Text style={[styles.section, { color: C.textMuted }]}>APPEARANCE</Text>
      {THEME_LIST.map((t) => {
        const isActive = themeName === t.name;
        return (
          <TouchableOpacity
            key={t.name}
            style={[styles.row, {
              backgroundColor: C.surface,
              borderColor: isActive ? C.purple : C.border,
              ...(isActive ? Shadow.card : {}),
              shadowColor: C.purple,
            }]}
            onPress={() => setTheme(t.name as ThemeName)}
            activeOpacity={0.7}
          >
            <Text style={styles.rowIcon}>{t.emoji}</Text>
            <Text style={[styles.rowLabel, { color: C.textPrimary }]}>{t.label}</Text>
            {isActive && (
              <View style={[styles.activeBadge, { backgroundColor: C.purplePale, borderColor: C.purple + '60' }]}>
                <Text style={[styles.activeBadgeText, { color: C.purple }]}>Active</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}

      {/* Security */}
      <Text style={[styles.section, { color: C.textMuted }]}>SECURITY</Text>
      <TouchableOpacity
        style={[styles.row, { backgroundColor: C.surface, borderColor: C.border }]}
        onPress={() => setShowPinModal(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.rowIcon}>🔒</Text>
        <View style={styles.rowTextBlock}>
          <Text style={[styles.rowLabel, { color: C.textPrimary }]}>Hidden Vault</Text>
          <Text style={[styles.rowSub, { color: C.textMuted }]}>PIN protected</Text>
        </View>
        <Text style={{ color: C.textMuted, fontSize: 16 }}>›</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.row, { backgroundColor: C.surface, borderColor: C.border }]}
        onPress={() => setShowChangePin(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.rowIcon}>🔑</Text>
        <View style={styles.rowTextBlock}>
          <Text style={[styles.rowLabel, { color: C.textPrimary }]}>Change PIN</Text>
          <Text style={[styles.rowSub, { color: C.textMuted }]}>Update your 4-digit PIN</Text>
        </View>
        <Text style={{ color: C.textMuted, fontSize: 16 }}>›</Text>
      </TouchableOpacity>

      {/* Storage */}
      <Text style={[styles.section, { color: C.textMuted }]}>STORAGE</Text>
      <TouchableOpacity
        style={[styles.row, { backgroundColor: C.surface, borderColor: C.border }]}
        onPress={() => setShowStorage(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.rowIcon}>📦</Text>
        <View style={styles.rowTextBlock}>
          <Text style={[styles.rowLabel, { color: C.textPrimary }]}>Storage & Cache</Text>
          <Text style={[styles.rowSub, { color: C.textMuted }]}>Manage recordings & data</Text>
        </View>
        <Text style={{ color: C.textMuted, fontSize: 16 }}>›</Text>
      </TouchableOpacity>

      {/* App */}
      <Text style={[styles.section, { color: C.textMuted }]}>APP</Text>
      <View style={[styles.row, { backgroundColor: C.surface, borderColor: C.border }]}>
        <Text style={styles.rowIcon}>🎙️</Text>
        <View style={styles.rowTextBlock}>
          <Text style={[styles.rowLabel, { color: C.textPrimary }]}>Nachi</Text>
          <Text style={[styles.rowSub, { color: C.textMuted }]}>Version 1.0.0</Text>
        </View>
        <Text style={{ color: C.textMuted, fontFamily: 'Sora_400Regular', fontSize: 12 }}>v1.0.0</Text>
      </View>
      <View style={[styles.row, { backgroundColor: C.surface, borderColor: C.border }]}>
        <Text style={styles.rowIcon}>🔐</Text>
        <View style={styles.rowTextBlock}>
          <Text style={[styles.rowLabel, { color: C.textPrimary }]}>Privacy</Text>
          <Text style={[styles.rowSub, { color: C.textMuted }]}>Offline · End-to-end encrypted</Text>
        </View>
      </View>

      <PinModal
        visible={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={() => { setShowPinModal(false); setShowVault(true); }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  eyebrow: {
    fontFamily: 'Sora_600SemiBold', fontSize: 11,
    letterSpacing: 1.5, marginBottom: 2,
  },
  section: {
    fontFamily: 'Sora_600SemiBold', fontSize: 11, letterSpacing: 1.5,
    paddingHorizontal: Spacing.xl, marginTop: Spacing.xxl, marginBottom: Spacing.sm,
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: 14,
    borderWidth: 1.5, borderRadius: Radius.lg,
    marginHorizontal: Spacing.xl, marginBottom: Spacing.sm, gap: 12,
  },
  rowIcon: { fontSize: 20 },
  rowLabel: { fontFamily: 'Sora_600SemiBold', fontSize: 14 },
  rowTextBlock: { flex: 1, gap: 2 },
  rowSub: { fontFamily: 'Sora_400Regular', fontSize: 11 },
  activeBadge: {
    paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: Radius.full, borderWidth: 1,
  },
  activeBadgeText: { fontFamily: 'Sora_600SemiBold', fontSize: 11 },
});

const pinStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#00000088', alignItems: 'center', justifyContent: 'center' },
  card: {
    width: 320, borderRadius: Radius.xxl, borderWidth: 1.5,
    padding: Spacing.xxl, alignItems: 'center',
  },
  dots: { flexDirection: 'row', gap: 16, marginBottom: 28 },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 1 },
  grid: { width: 240, flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  key: { width: 68, height: 52, borderRadius: Radius.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  keyEmpty: { backgroundColor: 'transparent', borderColor: 'transparent' },
  keyText: { fontSize: 20, fontFamily: 'Sora_600SemiBold' },
});

const vaultStyles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Spacing.xl, paddingTop: 60, borderBottomWidth: 1,
  },
  actions: { flexDirection: 'row', gap: 8, paddingHorizontal: 4, marginTop: -8, marginBottom: 12 },
  actionBtn: { flex: 1, borderWidth: 1.5, borderRadius: Radius.md, paddingVertical: 8, alignItems: 'center' },
  emptyIconWrap: { width: 72, height: 72, borderRadius: 24, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontFamily: 'Sora_700Bold', fontSize: 16, marginBottom: 8 },
});

const storageStyles = StyleSheet.create({
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Spacing.xl, paddingTop: 60, borderBottomWidth: 1,
  },
});
