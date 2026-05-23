// app/lock.tsx

import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Vibration,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import { useColors, Typography, Spacing, Radius } from '../src/theme';
import {
  isPinSet,
  savePin,
  verifyPin,
  isBiometricAvailable,
  authenticateWithBiometric,
} from '../src/services/authService';

const KEYS = [1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'] as const;

type Mode = 'enter' | 'setup_new' | 'setup_confirm';

export default function LockScreen() {
  const C = useColors();
  const [mode, setMode]           = useState<Mode>('enter');
  const [pin, setPin]             = useState('');
  const [newPinTemp, setNewPinTemp] = useState('');
  const [error, setError]         = useState('');
  const [hasBiometric, setHasBiometric] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      const ready = await isPinSet();
      if (!ready) setMode('setup_new');
      const bio = await isBiometricAvailable();
      setHasBiometric(bio);
    })();
  }, []);

  function shake() {
    Vibration.vibrate(200);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8,   duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,   duration: 60, useNativeDriver: true }),
    ]).start();
  }

  async function onKey(k: number | string) {
    if (k === '⌫') { setPin((p) => p.slice(0, -1)); setError(''); return; }
    if (k === '' || pin.length >= 4) return;

    const newPin = pin + String(k);
    setPin(newPin);
    setError('');
    if (newPin.length < 4) return;

    if (mode === 'enter') {
      const ok = await verifyPin(newPin);
      if (ok) {
        router.replace('/(tabs)');
      } else {
        setError('Wrong PIN. Try again.');
        shake();
        setTimeout(() => setPin(''), 600);
      }
    } else if (mode === 'setup_new') {
      setNewPinTemp(newPin);
      setPin('');
      setMode('setup_confirm');
    } else if (mode === 'setup_confirm') {
      if (newPin === newPinTemp) {
        await savePin(newPin);
        router.replace('/(tabs)');
      } else {
        setError('PINs do not match. Try again.');
        shake();
        setPin('');
        setNewPinTemp('');
        setMode('setup_new');
      }
    }
  }

  async function onBiometric() {
    const ok = await authenticateWithBiometric();
    if (ok) router.replace('/(tabs)');
  }

  const subtitle =
    mode === 'setup_new'     ? 'Choose a 4-digit PIN to secure AnVy' :
    mode === 'setup_confirm' ? 'Enter the same PIN again to confirm' :
    error                    ? error :
                               'Enter PIN to continue';

  const subtitleIsError = !!error;

  return (
    <View style={[styles.root, { backgroundColor: C.background }]}>
      <View style={styles.header}>
        <Text style={styles.lockIcon}>🔐</Text>
        <Text style={[styles.appName, { color: C.textPrimary }]}>AnVy</Text>
        {mode !== 'enter' && (
          <Text style={[styles.modeLabel, { color: C.neonBlue }]}>
            {mode === 'setup_new' ? 'Create PIN' : 'Confirm PIN'}
          </Text>
        )}
        <Text style={[styles.subtitle, { color: subtitleIsError ? C.red : C.textMuted }]}>
          {subtitle}
        </Text>
      </View>

      {/* PIN dots */}
      <Animated.View style={[styles.dotsRow, { transform: [{ translateX: shakeAnim }] }]}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={[
              styles.pinDot,
              { backgroundColor: C.border, borderColor: C.border },
              i < pin.length && { backgroundColor: C.neonBlue, borderColor: C.neonBlue, shadowColor: C.neonBlue },
              subtitleIsError && { backgroundColor: C.red, borderColor: C.red },
            ]}
          />
        ))}
      </Animated.View>

      {/* Numpad */}
      <View style={styles.grid}>
        {KEYS.map((k, idx) => (
          <TouchableOpacity
            key={idx}
            style={[
              styles.key,
              { backgroundColor: C.surface, borderColor: C.border },
              k === '' && styles.keyEmpty,
            ]}
            onPress={() => k !== '' && onKey(k)}
            activeOpacity={k === '' ? 1 : 0.6}
            disabled={k === ''}
          >
            {k !== '' && (
              <Text style={[styles.keyText, { color: C.textPrimary }]}>{k}</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Biometric */}
      {hasBiometric && mode === 'enter' && (
        <TouchableOpacity style={styles.bioBtn} onPress={onBiometric}>
          <Text style={styles.bioIcon}>👆</Text>
          <Text style={[styles.bioLabel, { color: C.neonBlue }]}>Use Fingerprint</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  header: { alignItems: 'center', marginBottom: 40 },
  lockIcon: { fontSize: 48, marginBottom: 12 },
  appName: { ...Typography.displayM, marginBottom: 8 },
  modeLabel: { fontFamily: 'Sora_700Bold', fontSize: 16, marginBottom: 4 },
  subtitle: { ...Typography.bodyM, textAlign: 'center' },
  dotsRow: { flexDirection: 'row', gap: 16, marginBottom: 48 },
  pinDot: {
    width: 14, height: 14, borderRadius: 7, borderWidth: 1,
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 6, elevation: 6,
  },
  grid: { width: 264, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  key: {
    width: 80, height: 60, borderRadius: Radius.lg,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  keyEmpty: { backgroundColor: 'transparent', borderColor: 'transparent' },
  keyText: { fontSize: 22, fontFamily: 'Sora_600SemiBold' },
  bioBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 28 },
  bioIcon: { fontSize: 22 },
  bioLabel: { ...Typography.bodyM },
});
