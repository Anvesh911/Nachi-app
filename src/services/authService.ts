// src/services/authService.ts
// Converted from Flutter local_auth + SharedPreferences → expo-local-authentication + expo-secure-store

import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const PIN_KEY = 'nachi_pin';
const DEFAULT_PIN = '1234';

export async function getStoredPin(): Promise<string> {
  try {
    const pin = await SecureStore.getItemAsync(PIN_KEY);
    return pin ?? DEFAULT_PIN;
  } catch {
    return DEFAULT_PIN;
  }
}

export async function savePin(pin: string): Promise<void> {
  await SecureStore.setItemAsync(PIN_KEY, pin);
}

export async function verifyPin(input: string): Promise<boolean> {
  const stored = await getStoredPin();
  return input === stored;
}

export async function isBiometricAvailable(): Promise<boolean> {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return compatible && enrolled;
}

export async function authenticateWithBiometric(): Promise<boolean> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock Nachi',
      fallbackLabel: 'Use PIN',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });
    return result.success;
  } catch {
    return false;
  }
}
