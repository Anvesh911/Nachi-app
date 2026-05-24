// src/screens/RecordingSheet.tsx

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Animated, Alert, ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { router } from 'expo-router';
import { useColors, Typography, Spacing, Radius } from '../theme';
import {
  startRecording, stopRecording, cancelRecording, formatDuration,
} from '../services/recordingService';
import { useStore } from '../store/useStore';
import { Conversation } from '../services/types';
import { SavedModal } from '../components';

const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2,9)}`;
const AVATAR_COLORS = ['#00B4FF', '#7C5CFC', '#FF9F43', '#55EFC4', '#FD79A8'];

type Step = 'consent' | 'ready' | 'recording' | 'processing' | 'saved';

interface Props { onClose: () => void; }

export default function RecordingSheet({ onClose }: Props) {
  const C = useColors();
  const [step, setStep]                   = useState<Step>('consent');
  const [seconds, setSeconds]             = useState(0);
  const [contactName, setContactName]     = useState('');
  const [processingMsg, setProcessingMsg] = useState('Saving...');
  const [savedConvId, setSavedConvId]     = useState('');
  const [savedName, setSavedName]         = useState('');
  const { addConversation } = useStore();

  const bars     = useRef<Animated.Value[]>(Array.from({ length: 24 }, () => new Animated.Value(4))).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const waveRef  = useRef<Animated.CompositeAnimation | null>(null);

  const startWaveform = useCallback(() => {
    const animations = bars.map((bar, i) => {
      const maxH = i % 3 === 0 ? 40 : i % 2 === 0 ? 28 : 18;
      return Animated.loop(Animated.sequence([
        Animated.timing(bar, { toValue: maxH, duration: 300 + i * 30, useNativeDriver: false }),
        Animated.timing(bar, { toValue: 4,    duration: 300 + i * 30, useNativeDriver: false }),
      ]));
    });
    waveRef.current = Animated.parallel(animations);
    waveRef.current.start();
  }, [bars]);

  const stopWaveform = useCallback(() => {
    waveRef.current?.stop();
    bars.forEach((b) => b.setValue(4));
  }, [bars]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stopWaveform();
      cancelRecording();
    };
  }, []);

  async function handleStartRecord() {
    const ok = await startRecording();
    if (!ok) {
      Alert.alert('Permission denied', 'Microphone permission is required to record.');
      return;
    }
    setStep('recording');
    setSeconds(0);
    try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch (_) {}
    startWaveform();
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
  }

  async function handleStopRecord() {
    if (timerRef.current) clearInterval(timerRef.current);
    stopWaveform();
    try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); } catch (_) {}
    setStep('processing');
    setProcessingMsg('Saving recording...');
    try {
      const result = await stopRecording();
      await saveConversation(result?.filePath, result?.durationSeconds ?? seconds);
    } catch (e) {
      console.error('Stop recording error:', e);
      await saveConversation(undefined, seconds);
    }
  }

  async function handleImportAudio() {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['audio/mpeg', 'audio/wav', 'audio/x-m4a', 'audio/mp4', 'audio/*'],
        copyToCacheDirectory: true,
      });
      if (res.canceled || !res.assets?.[0]) return;
      const file = res.assets[0];
      setStep('processing');
      setProcessingMsg('Importing audio...');
      const dir  = FileSystem.documentDirectory + 'anvy_recordings/';
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
      const ext  = file.name.split('.').pop() ?? 'm4a';
      const dest = dir + `imported_${makeId()}.${ext}`;
      await FileSystem.copyAsync({ from: file.uri, to: dest });
      await saveConversation(dest, 0, file.name.replace(/\.[^.]+$/, ''));
    } catch (e) {
      console.error('Import error:', e);
      Alert.alert('Import Failed', 'Could not import the audio file. Please try again.');
      setStep('ready');
    }
  }

  async function saveConversation(filePath?: string, durationSecs?: number, importedName?: string) {
    setProcessingMsg('Saving conversation...');
    const name     = importedName ?? (contactName.trim() || 'Unknown Contact');
    const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
    const color    = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
    const dur      = durationSecs ?? 0;
    const id       = makeId();

    const newConv: Conversation = {
      id,
      contact: name,
      avatar: initials,
      avatarColor: color,
      date: new Date().toISOString(),
      durationSeconds: dur,
      durationLabel: formatDuration(dur),
      tag: 'General',
      tagColor: '#636E72',
      starred: false,
      hidden: false,
      audioFilePath: filePath,
      transcript: filePath
        ? 'Audio saved to device. Transcription not available offline.'
        : 'No audio recorded.',
      summary: {
        keyPoints: ['Recording saved locally'],
        promises: [],
        tasks: [],
        dates: [],
        datePlans: [],
        reminders: [],
        tone: 'Recorded',
        toneEmoji: '🎙️',
        toneDescription: '',
        tags: [],
      },
      topics: ['recording'],
    };

    try { await addConversation(newConv); } catch (e) { console.error('saveConversation error:', e); }

    setSavedConvId(id);
    setSavedName(name);
    setStep('saved');
  }

  // ── Consent ───────────────────────────────────────────────────────────────
  if (step === 'consent') {
    return (
      <View style={[styles.sheet, { backgroundColor: C.surface, borderColor: C.border }]}>
        <View style={[styles.handle, { backgroundColor: C.border }]} />
        <Text style={styles.icon}>🌙</Text>
        <Text style={[styles.title, { color: C.textPrimary }]}>Recording Consent</Text>
        <Text style={[styles.body, { color: C.textMuted }]}>
          Please ensure all parties have consented to be recorded.
          Recording without consent may violate local laws (IT Act, 2000).
        </Text>
        <View style={styles.btnRow}>
          <TouchableOpacity style={[styles.cancelBtn, { borderColor: C.border }]} onPress={onClose}>
            <Text style={[styles.cancelBtnText, { color: C.textMuted }]}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: C.neonBlue }]} onPress={() => setStep('ready')}>
            <Text style={styles.primaryBtnText}>I Consent ✓</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Processing ────────────────────────────────────────────────────────────
  if (step === 'processing') {
    return (
      <View style={[styles.sheet, { backgroundColor: C.surface, borderColor: C.border }]}>
        <View style={[styles.handle, { backgroundColor: C.border }]} />
        <ActivityIndicator size="large" color={C.neonBlue} style={{ marginVertical: 28 }} />
        <Text style={[styles.title, { color: C.textPrimary }]}>{processingMsg}</Text>
        <Text style={[styles.hint, { color: C.textMuted }]}>Please wait...</Text>
      </View>
    );
  }

  // ── Saved ─────────────────────────────────────────────────────────────────
  if (step === 'saved') {
    return (
      <View style={[styles.sheet, { backgroundColor: C.surface, borderColor: C.border }]}>
        <View style={[styles.handle, { backgroundColor: C.border }]} />
        <SavedModal
          visible={true}
          contactName={savedName}
          onViewSummary={() => { onClose(); router.push(`/detail/${savedConvId}?tab=summary`); }}
          onViewTranscript={() => { onClose(); router.push(`/detail/${savedConvId}?tab=transcript`); }}
          onDismiss={onClose}
        />
      </View>
    );
  }

  // ── Ready / Recording ─────────────────────────────────────────────────────
  return (
    <View style={[styles.sheet, { backgroundColor: C.surface, borderColor: C.border }]}>
      <View style={[styles.handle, { backgroundColor: C.border }]} />

      {step === 'recording' ? (
        <>
          <Text style={[styles.recLabel, { color: C.red }]}>● RECORDING</Text>
          <Text style={[styles.timer, { color: C.textPrimary }]}>{formatDuration(seconds)}</Text>
          <View style={styles.waveform}>
            {bars.map((bar, i) => (
              <Animated.View key={i} style={[styles.bar, { height: bar, backgroundColor: C.neonBlue }]} />
            ))}
          </View>
        </>
      ) : (
        <>
          <Text style={[styles.title, { color: C.textPrimary }]}>New Recording</Text>
          <TextInput
            style={[styles.input, { backgroundColor: C.surfaceVariant, borderColor: C.border, color: C.textSecondary }]}
            placeholder="Contact name (optional)"
            placeholderTextColor={C.textMuted}
            value={contactName}
            onChangeText={setContactName}
          />
          <TouchableOpacity style={[styles.importBtn, { borderColor: C.border }]} onPress={handleImportAudio}>
            <Text style={[styles.importBtnText, { color: C.textMuted }]}>📂  Import Audio File (mp3, wav, m4a)</Text>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity
        onPress={step === 'recording' ? handleStopRecord : handleStartRecord}
        style={[
          styles.recBtn,
          { backgroundColor: step === 'recording' ? C.red : C.neonBlue,
            shadowColor: step === 'recording' ? C.red : C.neonBlue },
        ]}
        activeOpacity={0.8}
      >
        <Text style={styles.recBtnIcon}>{step === 'recording' ? '⏹' : '🌙'}</Text>
      </TouchableOpacity>
      <Text style={[styles.hint, { color: C.textMuted }]}>
        {step === 'recording' ? 'Tap to stop recording' : 'Tap to start recording'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: { borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl, borderTopWidth: 1, paddingHorizontal: 28, paddingBottom: 48, paddingTop: 16, alignItems: 'center' },
  handle: { width: 40, height: 4, borderRadius: 2, marginBottom: 24 },
  icon: { fontSize: 48, marginBottom: 12 },
  title: { ...Typography.headingL, marginBottom: 12, textAlign: 'center' },
  body: { ...Typography.bodyM, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  btnRow: { flexDirection: 'row', gap: 12, width: '100%' },
  cancelBtn: { flex: 1, borderWidth: 1, borderRadius: Radius.md, paddingVertical: 14, alignItems: 'center' },
  cancelBtnText: { fontFamily: 'Sora_600SemiBold' },
  primaryBtn: { flex: 1, borderRadius: Radius.md, paddingVertical: 14, alignItems: 'center' },
  primaryBtnText: { fontFamily: 'Sora_700Bold', color: '#000' },
  recLabel: { fontSize: 11, fontFamily: 'Sora_600SemiBold', letterSpacing: 2, marginBottom: 8 },
  timer: { fontFamily: 'Sora_800ExtraBold', fontSize: 52, letterSpacing: 2, marginBottom: 16 },
  waveform: { flexDirection: 'row', alignItems: 'flex-end', height: 52, gap: 3, marginBottom: 28 },
  bar: { width: 4, borderRadius: 2 },
  input: { width: '100%', borderWidth: 1, borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: 12, fontFamily: 'Sora_400Regular', fontSize: 13, marginBottom: 12 },
  importBtn: { width: '100%', borderWidth: 1, borderRadius: Radius.md, paddingVertical: 12, alignItems: 'center', marginBottom: 24 },
  importBtnText: { fontFamily: 'Sora_600SemiBold', fontSize: 13 },
  recBtn: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 12, marginBottom: 12 },
  recBtnIcon: { fontSize: 28 },
  hint: { ...Typography.bodyS },
});
