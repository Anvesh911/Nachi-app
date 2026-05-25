// app/(tabs)/settings.tsx

import { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Modal, Animated, Vibration, Alert,
} from 'react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import * as FileSystem from 'expo-file-system';
import { useColors, useThemeStore, THEME_LIST, ThemeName, Typography, Spacing, Radius } from '../../src/theme';
import { verifyPin, savePin } from '../../src/services/authService';
import { useStore } from '../../src/store/useStore';
import { ConvCard } from '../../src/components';
import { Conversation } from '../../src/services/types';
import { getStorageInfo, clearAllTranscripts, deleteOldConversations } from '../../src/services/database';

const KEYS = [1,2,3,4,5,6,7,8,9,'',0,'⌫'] as const;

// ─── Colored Icon Box — matches HTML .sicon ───────────────────────────────────
function IconBox({ bg, children }: { bg: string; children: React.ReactNode }) {
  return (
    <View style={[iconStyles.box, { backgroundColor: bg }]}>
      {children}
    </View>
  );
}
const iconStyles = StyleSheet.create({
  box: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
});

// ─── SVG Icons for settings rows ─────────────────────────────────────────────
function LockIcon({ color = '#E53935' }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Rect x={5} y={11} width={14} height={11} rx={2} stroke={color} strokeWidth={2}/>
      <Path d="M8 11V7a4 4 0 018 0v4" stroke={color} strokeWidth={2} strokeLinecap="round"/>
    </Svg>
  );
}
function KeyIcon({ color = '#F9A825' }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}
function ArchiveIcon({ color = '#43A047' }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M21 8v13H3V8" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M23 3H1v5h22V3z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M10 12h4" stroke={color} strokeWidth={2} strokeLinecap="round"/>
    </Svg>
  );
}
function MicIcon({ color = '#7C4DFF' }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3C10.3 3 9 4.3 9 6v7c0 1.7 1.3 3 3 3s3-1.3 3-3V6c0-1.7-1.3-3-3-3z" stroke={color} strokeWidth={2}/>
      <Path d="M5 11c0 3.9 3.1 7 7 7s7-3.1 7-7" stroke={color} strokeWidth={2} strokeLinecap="round"/>
      <Path d="M12 18v3M9 21h6" stroke={color} strokeWidth={2} strokeLinecap="round"/>
    </Svg>
  );
}
function ShieldIcon({ color = '#1E88E5' }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M9 12l2 2 4-4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}
function ChevronRight({ color = '#C4B8E8' }: { color?: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

// ─── Settings Row ─────────────────────────────────────────────────────────────
function SettingsRow({
  iconBg, Icon, label, sub, right, onPress,
}: {
  iconBg: string;
  Icon: React.ReactNode;
  label: string;
  sub?: string;
  right?: React.ReactNode;
  onPress?: () => void;
}) {
  const C = useColors();
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper
      style={[styles.row, { backgroundColor: C.surface, borderColor: C.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <IconBox bg={iconBg}>{Icon}</IconBox>
      <View style={styles.rowTextBlock}>
        <Text style={[styles.rowLabel, { color: C.textPrimary }]}>{label}</Text>
        {sub && <Text style={[styles.rowSub, { color: C.textMuted }]}>{sub}</Text>}
      </View>
      {right ?? <ChevronRight />}
    </Wrapper>
  );
}

// ─── PIN Modal ────────────────────────────────────────────────────────────────
function PinModal({ visible, onClose, onSuccess }: {
  visible: boolean; onClose: () => void; onSuccess: () => void;
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
    setPin(np); setError('');
    if (np.length < 4) return;
    const ok = await verifyPin(np);
    if (ok) { setPin(''); setError(''); onSuccess(); }
    else { setError('Wrong PIN. Try again.'); shake(); setTimeout(() => setPin(''), 500); }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={pinStyles.backdrop}>
        <View style={[pinStyles.card, { backgroundColor: C.surface, borderColor: C.border, shadowColor: C.purple }]}>
          <Text style={[Typography.headingL, { color: C.textPrimary, marginBottom: 4 }]}>Enter PIN</Text>
          {error
            ? <Text style={{ color: C.red, fontFamily: 'Sora_400Regular', fontSize: 12, marginBottom: 12 }}>{error}</Text>
            : <View style={{ height: 20 }} />}
          <Animated.View style={[pinStyles.dots, { transform: [{ translateX: shakeAnim }] }]}>
            {[0,1,2,3].map((i) => (
              <View key={i} style={[
                pinStyles.dot, { backgroundColor: C.border, borderColor: C.border },
                i < pin.length && { backgroundColor: C.purple, borderColor: C.purple },
              ]} />
            ))}
          </Animated.View>
          <View style={pinStyles.grid}>
            {KEYS.map((k, idx) => (
              <TouchableOpacity
                key={idx}
                style={[pinStyles.key, { backgroundColor: C.surfaceVariant, borderColor: C.border }, k === '' && pinStyles.keyEmpty]}
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
  const [step, setStep]             = useState<'current' | 'new' | 'confirm'>('current');
  const [newPinTemp, setNewPinTemp] = useState('');
  const [pin, setPin]               = useState('');
  const [error, setError]           = useState('');
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
    setPin(np); setError('');
    if (np.length < 4) return;
    if (step === 'current') {
      const ok = await verifyPin(np);
      if (ok) { setPin(''); setStep('new'); }
      else { setError('Wrong PIN'); shake(); setTimeout(() => setPin(''), 500); }
    } else if (step === 'new') {
      setNewPinTemp(np); setPin(''); setStep('confirm');
    } else {
      if (np === newPinTemp) { await savePin(np); Alert.alert('PIN Changed', 'Your PIN has been updated.'); onClose(); }
      else { setError('PINs do not match'); shake(); setPin(''); setNewPinTemp(''); setStep('new'); }
    }
  }

  const title = step === 'current' ? 'Current PIN' : step === 'new' ? 'New PIN' : 'Confirm PIN';

  return (
    <View style={{ flex: 1, backgroundColor: C.background, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
      <TouchableOpacity onPress={onClose} style={{ position: 'absolute', top: 60, left: 20 }}>
        <Text style={{ color: C.purple, fontFamily: 'Sora_600SemiBold', fontSize: 14 }}>← Cancel</Text>
      </TouchableOpacity>
      <Text style={[Typography.headingL, { color: C.textPrimary, marginBottom: 8 }]}>Change PIN</Text>
      <Text style={[Typography.bodyM, { color: C.purple, marginBottom: 4 }]}>{title}</Text>
      {error ? <Text style={{ color: C.red, fontFamily: 'Sora_400Regular', fontSize: 12, marginBottom: 12 }}>{error}</Text>
             : <View style={{ height: 20 }} />}
      <Animated.View style={[pinStyles.dots, { transform: [{ translateX: shakeAnim }] }]}>
        {[0,1,2,3].map((i) => (
          <View key={i} style={[pinStyles.dot, { backgroundColor: C.border, borderColor: C.border },
            i < pin.length && { backgroundColor: C.purple, borderColor: C.purple }]} />
        ))}
      </Animated.View>
      <View style={pinStyles.grid}>
        {KEYS.map((k, idx) => (
          <TouchableOpacity
            key={idx}
            style={[pinStyles.key, { backgroundColor: C.surface, borderColor: C.border }, k === '' && pinStyles.keyEmpty]}
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
  const [info, setInfo]       = useState({ conversationsCount: 0, remindersCount: 0, transcriptChars: 0 });
  const [recSize, setRecSize] = useState(0);

  useEffect(() => { loadInfo(); }, []);

  async function loadInfo() {
    try {
      const dbInfo = await getStorageInfo(); setInfo(dbInfo);
      const dir = FileSystem.documentDirectory + 'anvy_recordings/';
      try {
        const files = await FileSystem.readDirectoryAsync(dir);
        let total = 0;
        for (const f of files) { const i = await FileSystem.getInfoAsync(dir + f); if (i.exists && 'size' in i) total += (i as any).size ?? 0; }
        setRecSize(total);
      } catch (_) { setRecSize(0); }
    } catch (e) { console.error(e); }
  }

  function fmt(b: number) {
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b/1024).toFixed(1)} KB`;
    return `${(b/(1024*1024)).toFixed(1)} MB`;
  }

  const items = [
    { label: 'Conversations', value: `${info.conversationsCount} saved`, iconBg: '#E8F5E9', Icon: <ArchiveIcon color="#43A047"/> },
    { label: 'Reminders',     value: `${info.remindersCount} active`,   iconBg: '#FFF0F0', Icon: <LockIcon color="#E53935"/> },
    { label: 'Transcripts',   value: fmt(info.transcriptChars * 2),      iconBg: '#FFF8E1', Icon: <KeyIcon color="#F9A825"/> },
    { label: 'Recordings',    value: fmt(recSize),                        iconBg: '#EDE8FF', Icon: <MicIcon color="#7C4DFF"/> },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.background }} contentContainerStyle={{ paddingBottom: 60 }}>
      <View style={[storageStyles.header, { borderBottomColor: C.border }]}>
        <TouchableOpacity onPress={onClose}>
          <Text style={{ color: C.purple, fontFamily: 'Sora_600SemiBold', fontSize: 14 }}>← Back</Text>
        </TouchableOpacity>
        <Text style={[Typography.headingL, { color: C.textPrimary }]}>Storage</Text>
        <View style={{ width: 60 }} />
      </View>
      <Text style={[styles.section, { color: C.textMuted }]}>USAGE</Text>
      {items.map((item) => (
        <SettingsRow key={item.label} iconBg={item.iconBg} Icon={item.Icon} label={item.label}
          right={<Text style={{ color: C.textMuted, fontFamily: 'Sora_400Regular', fontSize: 12 }}>{item.value}</Text>}
        />
      ))}
      <Text style={[styles.section, { color: C.textMuted }]}>ACTIONS</Text>
      <SettingsRow iconBg="#E3F2FD" Icon={<ShieldIcon color="#1E88E5"/>} label="Recalculate Storage" onPress={loadInfo} />
      <SettingsRow iconBg="#FFF0F0" Icon={<LockIcon color="#E53935"/>} label="Clear All Transcripts"
        right={<ChevronRight/>}
        onPress={() => Alert.alert('Clear Transcripts', 'Remove all transcript text?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Clear', style: 'destructive', onPress: async () => { await clearAllTranscripts(); await loadConversations(); await loadInfo(); Alert.alert('Done', 'All transcripts cleared.'); }},
        ])}
      />
      <SettingsRow iconBg="#FFF8E1" Icon={<KeyIcon color="#F9A825"/>} label="Delete Old (30d+)"
        right={<ChevronRight/>}
        onPress={() => Alert.alert('Delete Old', 'Delete unstarred conversations older than 30 days?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: async () => {
            const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30);
            const count = await deleteOldConversations(cutoff.toISOString());
            await loadConversations(); await loadInfo();
            Alert.alert('Done', `${count} conversation(s) deleted.`);
          }},
        ])}
      />
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
              <TouchableOpacity style={[vaultStyles.actionBtn, { borderColor: C.purple }]} onPress={() => unhideConversation(item.id)}>
                <Text style={{ color: C.purple, fontFamily: 'Sora_600SemiBold', fontSize: 12 }}>Unhide</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[vaultStyles.actionBtn, { borderColor: C.red }]}
                onPress={() => Alert.alert('Delete', 'Delete permanently?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: () => removeConversation(item.id) },
                ])}>
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
      {/* Header — from HTML: set-title: font-size:26px, font-weight:900, padding:12px 20px 16px */}
      <Text style={[styles.settingsTitle, { color: C.textPrimary }]}>Settings</Text>

      {/* Appearance — theme swatches */}
      <Text style={[styles.section, { color: C.textMuted }]}>APPEARANCE</Text>
      <View style={[styles.themeRow, { paddingHorizontal: 14 }]}>
        {THEME_LIST.map((t) => {
          const isActive = themeName === t.name;
          const swatchBg: Record<string, string> = {
            light:  '#F0EDFF', purple: '#1A0933',
            dark:   '#0C0E1A', amoled: '#000000',
          };
          return (
            <TouchableOpacity
              key={t.name}
              onPress={() => setTheme(t.name as ThemeName)}
              style={[
                styles.tswatch,
                { backgroundColor: swatchBg[t.name] },
                isActive && { borderColor: C.purple, borderWidth: 2 },
                !isActive && { borderColor: 'transparent', borderWidth: 2 },
              ]}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 14 }}>{t.emoji}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Security */}
      <Text style={[styles.section, { color: C.textMuted }]}>SECURITY</Text>
      <SettingsRow
        iconBg="#FFF0F0" Icon={<LockIcon color="#E53935"/>}
        label="Hidden Vault" sub="PIN protected"
        onPress={() => setShowPinModal(true)}
      />
      <SettingsRow
        iconBg="#FFF8E1" Icon={<KeyIcon color="#F9A825"/>}
        label="Change PIN" sub="Update your 4-digit PIN"
        onPress={() => setShowChangePin(true)}
      />

      {/* Storage */}
      <Text style={[styles.section, { color: C.textMuted }]}>STORAGE</Text>
      <SettingsRow
        iconBg="#E8F5E9" Icon={<ArchiveIcon color="#43A047"/>}
        label="Storage & Cache" sub="Manage recordings & data"
        onPress={() => setShowStorage(true)}
      />

      {/* App */}
      <Text style={[styles.section, { color: C.textMuted }]}>APP</Text>
      <SettingsRow
        iconBg="#EDE8FF" Icon={<MicIcon color="#7C4DFF"/>}
        label="Nachi" sub="Version 1.0.0"
        right={<Text style={{ color: C.textMuted, fontFamily: 'Sora_400Regular', fontSize: 11 }}>v1.0.0</Text>}
      />
      <SettingsRow
        iconBg="#E3F2FD" Icon={<ShieldIcon color="#1E88E5"/>}
        label="Privacy" sub="Offline · End-to-end encrypted"
      />

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
  // set-title: font-size:26px, font-weight:900, padding:12px 20px 16px
  settingsTitle: {
    fontSize: 26, fontFamily: 'Sora_800ExtraBold',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16,
  },
  // set-sec: font-size:10px, font-weight:800, letter-spacing:2px, padding:0 20px, margin-top:14px, margin-bottom:8px
  section: {
    fontSize: 10, fontFamily: 'Sora_700Bold', letterSpacing: 2,
    paddingHorizontal: 20, marginTop: 14, marginBottom: 8,
    textTransform: 'uppercase',
  },
  // srow: padding:13px 18px, margin:0 14px 8px, border-radius:16px, border:1.5px, gap:12px
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 18, paddingVertical: 13,
    borderWidth: 1.5, borderRadius: 16,
    marginHorizontal: 14, marginBottom: 8, gap: 12,
    shadowColor: '#7C4DFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  rowTextBlock: { flex: 1, gap: 1 },
  // srlabel: font-size:13px, font-weight:800
  rowLabel: { fontSize: 13, fontFamily: 'Sora_700Bold' },
  // srsub: font-size:11px, font-weight:500
  rowSub: { fontSize: 11, fontFamily: 'Sora_400Regular' },
  // theme swatches: height:40px, border-radius:12px, flex:1, gap:8px
  themeRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  tswatch: {
    flex: 1, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 2,
  },
});

const pinStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#00000088', alignItems: 'center', justifyContent: 'center' },
  card: {
    width: 320, borderRadius: Radius.xxl, borderWidth: 1.5,
    padding: Spacing.xxl, alignItems: 'center',
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 12,
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.xl, paddingTop: 60, borderBottomWidth: 1 },
  actions: { flexDirection: 'row', gap: 8, paddingHorizontal: 4, marginTop: -8, marginBottom: 12 },
  actionBtn: { flex: 1, borderWidth: 1.5, borderRadius: Radius.md, paddingVertical: 8, alignItems: 'center' },
  emptyIconWrap: { width: 72, height: 72, borderRadius: 24, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontFamily: 'Sora_700Bold', fontSize: 16, marginBottom: 8 },
});

const storageStyles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.xl, paddingTop: 60, borderBottomWidth: 1 },
});
