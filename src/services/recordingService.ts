// src/services/recordingService.ts
// Converted from Flutter RecordingService (record pkg) → expo-av Audio

import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

export interface RecordingResult {
  filePath: string;
  durationSeconds: number;
}

let _recording: Audio.Recording | null = null;
let _startTime: number = 0;

export async function requestPermissions(): Promise<boolean> {
  const { status } = await Audio.requestPermissionsAsync();
  return status === 'granted';
}

export async function startRecording(): Promise<boolean> {
  try {
    const granted = await requestPermissions();
    if (!granted) return false;

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const { recording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );

    _recording = recording;
    _startTime = Date.now();
    return true;
  } catch (e) {
    console.error('startRecording error:', e);
    return false;
  }
}

export async function stopRecording(): Promise<RecordingResult | null> {
  if (!_recording) return null;
  try {
    await _recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

    const uri = _recording.getURI();
    const durationSeconds = Math.floor((Date.now() - _startTime) / 1000);
    _recording = null;

    if (!uri) return null;

    // Move to permanent app storage
    const dir = FileSystem.documentDirectory + 'nachi_recordings/';
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    const fileName = `nachi_${Date.now()}.m4a`;
    const dest = dir + fileName;
    await FileSystem.moveAsync({ from: uri, to: dest });

    return { filePath: dest, durationSeconds };
  } catch (e) {
    console.error('stopRecording error:', e);
    return null;
  }
}

export async function cancelRecording(): Promise<void> {
  if (!_recording) return;
  try {
    await _recording.stopAndUnloadAsync();
    const uri = _recording.getURI();
    if (uri) await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch (_) {}
  _recording = null;
}

export function isRecording(): boolean {
  return _recording !== null;
}

export function formatDuration(seconds: number): string {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}
