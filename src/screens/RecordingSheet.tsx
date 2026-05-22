// src/screens/RecordingSheet.tsx
// Converted from Flutter RecordingSheet StatefulWidget + AnimationController waveform
// Uses expo-av Audio + Animated API

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, Radius } from '../theme';
import {
  startRecording,
  stopRecording,
  cancelRecording,
  formatDuration,
} from '../services/recordingService';
import { useStore } from '../store/useStore';
import { Conversation } from '../services/types';
import { v4 as uuidv4 } from 'uuid'; // add uuid to deps

interface Props {
  onClose: () => void;
}

export default function RecordingSheet({ onClose }: Props) {
  const [step, setStep] = useState<'consent' | 'ready' | 'recording'>('consent');
  const [seconds, setSeconds] = useState(0);
  const [contactName, setContactName] = useState('');
  const { addConversation } = useStore();

  // Waveform bars - converted from Flutter AnimationController
  const bars = useRef<Animated.Value[]>(
    Array.from({ length: 24 }, () => new Animated.Value(4))
  ).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const waveRef = useRef<Animated.CompositeAnimation | null>(null);

  const startWaveform = useCallback(() => {
    const animations = bars.map((bar, i) => {
      const maxH = i % 3 === 0 ? 40 : i % 2 === 0 ? 28 : 18;
      return Animated.loop(
        Animated.sequence([
          Animated.timing(bar, {
            toValue: maxH,
            duration: 300 + i * 30,
            useNativeDriver: false,
          }),
          Animated.timing(bar, {
            toValue: 4,
            duration: 300 + i * 30,
            useNativeDriver: false,
          }),
        ])
      );
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
      clearInterval(timerRef.current!);
      stopWaveform();
      cancelRecording();
    };
  }, []);

  async function handleConsent() {
    setStep('ready');
  }

  async function handleStartRecord() {
    const ok = await startRecording();
    if (!ok) {
      Alert.alert('Permission denied', 'Microphone permission is required to record.');
      return;
    }
    setStep('recording');
    setSeconds(0);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    startWaveform();
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
  }

  async function handleStopRecord() {
    clearInterval(timerRef.current!);
    stopWaveform();
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    const result = await stopRecording();
    const name = contactName.trim() || 'Unknown Contact';
    const initials = name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    const colors = ['#00B4FF', '#7C5CFC', '#FF9F43', '#55EFC4', '#FD79A8'];
    const avatarColor = colors[Math.floor(Math.random() * colors.length)];

    const newConv: Conversation = {
      id: Date.now().toString(),
      contact: name,
      avatar: initials,
      avatarColor,
      date: new Date().toISOString(),
      durationSeconds: result?.durationSeconds ?? seconds,
      durationLabel: formatDuration(result?.durationSeconds ?? seconds),
      tag: 'General',
      tagColor: '#636E72',
      starred: false,
      audioFilePath: result?.filePath,
      transcript: 'Transcription processing… Audio saved to device.',
      summary: {
        keyPoints: ['Recording saved — AI summary will be generated shortly'],
        promises: [],
        dates: [],
        reminders: ['Review this conversation once transcription completes'],
        tone: 'Processing...',
        toneEmoji: '⏳',
      },
      topics: ['new', 'recording'],
    };

    await addConversation(newConv);
    onClose();
  }

  // ── Consent Step ─────────────────────────────────────────────────────────
  if (step === 'consent') {
    return (
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.icon}>🎙️</Text>
        <Text style={styles.title}>Recording Consent</Text>
        <Text style={styles.body}>
          Please ensure all parties in this conversation have given consent to be recorded.
          Recording without consent may violate local laws (IT Act, 2000).
        </Text>
        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryBtn} onPress={handleConsent}>
            <Text style={styles.primaryBtnText}>I Consent ✓</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Ready / Recording Step ────────────────────────────────────────────────
  return (
    <View style={styles.sheet}>
      <View style={styles.handle} />

      {step === 'recording' ? (
        <>
          <Text style={styles.recLabel}>● RECORDING</Text>
          <Text style={styles.timer}>{formatDuration(seconds)}</Text>
          {/* Live waveform - converted from Flutter AnimatedBuilder bars */}
          <View style={styles.waveform}>
            {bars.map((bar, i) => (
              <Animated.View
                key={i}
                style={[styles.bar, { height: bar }]}
              />
            ))}
          </View>
        </>
      ) : (
        <>
          <Text style={styles.title}>Ready to record</Text>
          <TextInput
            style={styles.input}
            placeholder="Contact name (optional)"
            placeholderTextColor={Colors.textMuted}
            value={contactName}
            onChangeText={setContactName}
          />
        </>
      )}

      <TouchableOpacity
        onPress={step === 'recording' ? handleStopRecord : handleStartRecord}
        style={[styles.recBtn, step === 'recording' && styles.recBtnActive]}
        activeOpacity={0.8}
      >
        <Text style={styles.recBtnIcon}>
          {step === 'recording' ? '⏹' : '🎙️'}
        </Text>
      </TouchableOpacity>
      <Text style={styles.hint}>
        {step === 'recording' ? 'Tap to stop recording' : 'Tap to start recording'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    borderTopWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 28,
    paddingBottom: 48,
    paddingTop: 16,
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    marginBottom: 24,
  },
  icon: { fontSize: 48, marginBottom: 12 },
  title: {
    ...Typography.headingL,
    color: Colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  body: {
    ...Typography.bodyM,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontFamily: 'Sora_600SemiBold',
    color: Colors.textMuted,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: Colors.neonBlue,
    borderRadius: Radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: {
    fontFamily: 'Sora_700Bold',
    color: '#000',
  },
  recLabel: {
    fontSize: 11,
    color: Colors.red,
    fontFamily: 'Sora_600SemiBold',
    letterSpacing: 2,
    marginBottom: 8,
  },
  timer: {
    fontFamily: 'Sora_800ExtraBold',
    fontSize: 52,
    color: Colors.textPrimary,
    letterSpacing: 2,
    marginBottom: 16,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 52,
    gap: 3,
    marginBottom: 28,
  },
  bar: {
    width: 4,
    borderRadius: 2,
    backgroundColor: Colors.neonBlue,
  },
  input: {
    width: '100%',
    backgroundColor: Colors.surfaceVariant,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.textSecondary,
    fontFamily: 'Sora_400Regular',
    fontSize: 13,
    marginBottom: 28,
  },
  recBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.neonBlue,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.neonBlue,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
    marginBottom: 12,
  },
  recBtnActive: {
    backgroundColor: Colors.red,
    shadowColor: Colors.red,
  },
  recBtnIcon: { fontSize: 28 },
  hint: {
    ...Typography.bodyS,
    color: Colors.textMuted,
  },
});
