// app/detail/[id].tsx

import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Share,
  Alert,
  Animated,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, Radius } from '../../src/theme';
import { useStore } from '../../src/store/useStore';
import { Avatar, TagBadge, GlassCard } from '../../src/components';
import { Conversation } from '../../src/services/types';
import { format } from 'date-fns';

type DetailTab = 'summary' | 'transcript' | 'reminders';

export default function DetailScreen() {
  const { id, tab } = useLocalSearchParams<{ id: string; tab?: string }>();
  const insets = useSafeAreaInsets();
  const { conversations, toggleStar, removeConversation } = useStore();
  const conv = conversations.find((c) => c.id === id);

  // Support deep-linking to a specific tab from SavedModal
  const initialTab: DetailTab =
    tab === 'transcript' ? 'transcript' :
    tab === 'reminders'  ? 'reminders'  : 'summary';

  const [activeTab, setActiveTab]     = useState<DetailTab>(initialTab);
  const [isPlaying, setIsPlaying]     = useState(false);
  const [playProgress, setPlayProgress] = useState(0);
  const [exported, setExported]       = useState(false);

  const soundRef         = useRef<Audio.Sound | null>(null);
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const tabAnim          = useRef(new Animated.Value(0)).current;
  const TABS: DetailTab[] = ['summary', 'transcript', 'reminders'];

  useEffect(() => {
    const idx = TABS.indexOf(activeTab);
    Animated.spring(tabAnim, { toValue: idx, useNativeDriver: true, friction: 8 }).start();
  }, [activeTab]);

  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync();
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, []);

  if (!conv) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>❓</Text>
          <Text style={styles.emptyText}>Conversation not found.</Text>
        </View>
      </View>
    );
  }

  async function togglePlay() {
    if (!conv.audioFilePath) {
      if (isPlaying) {
        setIsPlaying(false);
        if (progressInterval.current) clearInterval(progressInterval.current);
      } else {
        setIsPlaying(true);
        setPlayProgress(0);
        progressInterval.current = setInterval(() => {
          setPlayProgress((p) => {
            if (p >= 1) {
              setIsPlaying(false);
              if (progressInterval.current) clearInterval(progressInterval.current);
              return 0;
            }
            return p + 0.003;
          });
        }, 50);
      }
      return;
    }

    if (isPlaying) {
      await soundRef.current?.pauseAsync();
      setIsPlaying(false);
      if (progressInterval.current) clearInterval(progressInterval.current);
    } else {
      if (!soundRef.current) {
        const { sound } = await Audio.Sound.createAsync(
          { uri: conv.audioFilePath },
          { shouldPlay: true }
        );
        soundRef.current = sound;
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded) {
            const prog = status.durationMillis
              ? status.positionMillis / status.durationMillis : 0;
            setPlayProgress(prog);
            if (status.didJustFinish) { setIsPlaying(false); setPlayProgress(0); }
          }
        });
      } else {
        await soundRef.current.playAsync();
      }
      setIsPlaying(true);
    }
  }

  async function handleExport() {
    const text =
      `AnVy — Conversation with ${conv.contact}\n` +
      `Date: ${format(new Date(conv.date), 'dd MMM yyyy, hh:mm a')}\n` +
      `Duration: ${conv.durationLabel}\n` +
      `Tag: ${conv.tag}\n\n` +
      `=== TRANSCRIPT ===\n${conv.transcript}\n\n` +
      `=== AI SUMMARY ===\n` +
      `Key Points:\n${conv.summary.keyPoints.map((p) => `• ${p}`).join('\n')}\n\n` +
      `Promises:\n${conv.summary.promises.map((p) => `□ ${p}`).join('\n')}\n\n` +
      `Dates:\n${conv.summary.dates.map((d) => `◆ ${d}`).join('\n')}\n\n` +
      `Reminders:\n${conv.summary.reminders.map((r) => `→ ${r}`).join('\n')}`;

    await Share.share({ message: text, title: `AnVy — ${conv.contact}` });
    setExported(true);
    setTimeout(() => setExported(false), 2000);
  }

  async function handleDelete() {
    Alert.alert(
      'Delete Conversation',
      `Delete conversation with ${conv.contact}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => { await removeConversation(conv.id); router.back(); },
        },
      ]
    );
  }

  const dateStr = format(new Date(conv.date), 'dd MMM yyyy');
  const timeStr = format(new Date(conv.date), 'hh:mm a');

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Avatar initials={conv.avatar} color={conv.avatarColor} size={36} />
        <View style={styles.headerMeta}>
          <Text style={styles.headerName} numberOfLines={1}>{conv.contact}</Text>
          <Text style={styles.headerSub}>{dateStr} · {timeStr} · {conv.durationLabel}</Text>
        </View>
        {/* Star action in header */}
        <TouchableOpacity onPress={() => toggleStar(conv.id)} hitSlop={8}>
          <Text style={{ fontSize: 20, opacity: conv.starred ? 1 : 0.35 }}>⭐</Text>
        </TouchableOpacity>
        {/* Share/export action in header */}
        <TouchableOpacity onPress={handleExport} hitSlop={8} style={{ marginLeft: 8 }}>
          <Text style={{ fontSize: 18, color: Colors.neonBlue }}>⬆</Text>
        </TouchableOpacity>
        {/* Delete action in header */}
        <TouchableOpacity onPress={handleDelete} hitSlop={8} style={{ marginLeft: 8 }}>
          <Text style={{ fontSize: 18, color: Colors.red }}>🗑</Text>
        </TouchableOpacity>
      </View>

      {exported && (
        <View style={styles.exportedBanner}>
          <Text style={styles.exportedText}>✓ Transcript shared</Text>
        </View>
      )}

      {/* Audio player */}
      <View style={styles.player}>
        <TouchableOpacity onPress={togglePlay} style={styles.playBtn}>
          <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶'}</Text>
        </TouchableOpacity>
        <View style={styles.playerTrack}>
          <View style={styles.trackBg}>
            <View style={[styles.trackFill, { width: `${playProgress * 100}%` }]} />
          </View>
          <View style={styles.trackTimes}>
            <Text style={styles.trackTime}>
              {formatDur(Math.floor(playProgress * conv.durationSeconds))}
            </Text>
            <Text style={styles.trackTime}>{conv.durationLabel}</Text>
          </View>
        </View>
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={styles.tabItem}
            onPress={() => { setActiveTab(tab); Haptics.selectionAsync(); }}
          >
            <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
            {activeTab === tab && <View style={styles.tabUnderline} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.tabContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'summary'    && <SummaryTab conv={conv} onDelete={handleDelete} />}
        {activeTab === 'transcript' && <TranscriptTab conv={conv} />}
        {activeTab === 'reminders'  && <RemindersTab conv={conv} onDelete={handleDelete} />}
      </ScrollView>
    </View>
  );
}

// ── Summary Tab ───────────────────────────────────────────────────────────────
function SummaryTab({ conv, onDelete }: { conv: Conversation; onDelete: () => void }) {
  return (
    <>
      {/* Tag displayed in summary */}
      <View style={styles.summaryTagRow}>
        <TagBadge label={conv.tag} color={conv.tagColor} />
        <Text style={styles.summaryDate}>
          {format(new Date(conv.date), 'dd MMM yyyy')}
        </Text>
      </View>

      <GlassCard title="🔑 Key Points" accentColor={Colors.neonBlue}>
        {conv.summary.keyPoints.map((p, i) => (
          <View key={i} style={styles.bulletRow}>
            <Text style={[styles.bullet, { color: Colors.neonBlue }]}>·</Text>
            <Text style={styles.bulletText}>{p}</Text>
          </View>
        ))}
      </GlassCard>

      <GlassCard title="🤝 Promises & Tasks" accentColor={Colors.purple}>
        {conv.summary.promises.length ? conv.summary.promises.map((p, i) => (
          <View key={i} style={styles.bulletRow}>
            <Text style={[styles.bullet, { color: Colors.purple }]}>□</Text>
            <Text style={styles.bulletText}>{p}</Text>
          </View>
        )) : <Text style={styles.mutedText}>No promises recorded</Text>}
      </GlassCard>

      <GlassCard title="📅 Dates & Plans" accentColor={Colors.orange}>
        {conv.summary.dates.length ? conv.summary.dates.map((d, i) => (
          <View key={i} style={styles.bulletRow}>
            <Text style={[styles.bullet, { color: Colors.orange }]}>◆</Text>
            <Text style={styles.bulletText}>{d}</Text>
          </View>
        )) : <Text style={styles.mutedText}>No dates recorded</Text>}
      </GlassCard>

      <View style={styles.toneCard}>
        <Text style={styles.toneLabel}>EMOTIONAL TONE</Text>
        <Text style={styles.toneEmoji}>{conv.summary.toneEmoji}</Text>
        <Text style={styles.toneName}>{conv.summary.tone}</Text>
      </View>

      {/* Topics */}
      <View style={styles.topicsRow}>
        {conv.topics.map((t) => (
          <View key={t} style={styles.topicChip}>
            <Text style={styles.topicText}>#{t}</Text>
          </View>
        ))}
      </View>

      {/* Star + Delete + Share actions in summary */}
      <View style={styles.summaryActions}>
        <TouchableOpacity style={[styles.actionBtn, { borderColor: Colors.red + '44' }]} onPress={onDelete}>
          <Text style={{ color: Colors.red, fontFamily: 'Sora_600SemiBold', fontSize: 13 }}>🗑 Delete</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

// ── Transcript Tab ────────────────────────────────────────────────────────────
function TranscriptTab({ conv }: { conv: Conversation }) {
  return (
    <View style={styles.transcriptCard}>
      <Text style={styles.transcriptLabel}>FULL TRANSCRIPT</Text>
      <Text style={styles.transcriptText}>{conv.transcript}</Text>
    </View>
  );
}

// ── Reminders Tab ─────────────────────────────────────────────────────────────
function RemindersTab({ conv, onDelete }: { conv: Conversation; onDelete: () => void }) {
  return (
    <>
      <Text style={styles.remindersHeader}>THINGS TO REMEMBER</Text>
      {conv.summary.reminders.length ? conv.summary.reminders.map((r, i) => (
        <View key={i} style={styles.reminderRow}>
          <View style={styles.reminderDot} />
          <Text style={styles.reminderText}>{r}</Text>
        </View>
      )) : (
        <Text style={styles.mutedText}>No reminders for this conversation.</Text>
      )}
      <TouchableOpacity style={styles.addReminderBtn}>
        <Text style={styles.addReminderText}>+ Set Reminder</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onDelete} style={styles.deleteBtn}>
        <Text style={styles.deleteBtnText}>🗑 Delete Conversation</Text>
      </TouchableOpacity>
    </>
  );
}

function formatDur(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, gap: Spacing.sm,
  },
  backBtn: { paddingRight: 4 },
  backIcon: { fontSize: 32, color: Colors.neonBlue, lineHeight: 36 },
  headerMeta: { flex: 1 },
  headerName: { ...Typography.headingM, color: Colors.textPrimary },
  headerSub: { fontSize: 11, color: Colors.textMuted, fontFamily: 'Sora_400Regular' },

  exportedBanner: {
    backgroundColor: Colors.neonBlue + '22', borderColor: Colors.neonBlue + '44',
    borderWidth: 1, borderRadius: Radius.sm,
    marginHorizontal: Spacing.xl, marginBottom: Spacing.sm,
    paddingVertical: 8, alignItems: 'center',
  },
  exportedText: { fontSize: 12, color: Colors.neonBlue, fontFamily: 'Sora_600SemiBold' },

  player: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    marginHorizontal: Spacing.xl, marginBottom: Spacing.md,
    padding: 14, gap: 12,
  },
  playBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.neonBlue, alignItems: 'center', justifyContent: 'center' },
  playIcon: { fontSize: 18, color: '#000' },
  playerTrack: { flex: 1 },
  trackBg: { height: 4, backgroundColor: Colors.border, borderRadius: 2, overflow: 'hidden', marginBottom: 4 },
  trackFill: { height: '100%', backgroundColor: Colors.neonBlue, borderRadius: 2 },
  trackTimes: { flexDirection: 'row', justifyContent: 'space-between' },
  trackTime: { fontSize: 10, color: Colors.textMuted, fontFamily: 'Sora_400Regular' },

  tabBar: {
    flexDirection: 'row', backgroundColor: Colors.surfaceVariant,
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border,
    marginHorizontal: Spacing.xl, marginBottom: Spacing.md, padding: 3,
  },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 9 },
  tabLabel: { fontFamily: 'Sora_600SemiBold', fontSize: 12, color: Colors.textMuted },
  tabLabelActive: { color: Colors.neonBlue },
  tabUnderline: { position: 'absolute', bottom: -3, height: 2, width: '60%', backgroundColor: Colors.neonBlue, borderRadius: 1 },

  tabContent: { padding: Spacing.xl, paddingBottom: 100 },

  // Summary tag row
  summaryTagRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  summaryDate: { fontSize: 11, color: Colors.textMuted, fontFamily: 'Sora_400Regular' },

  bulletRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  bullet: { fontSize: 14, lineHeight: 22 },
  bulletText: { flex: 1, fontSize: 13, color: Colors.textSecondary, lineHeight: 21, fontFamily: 'Sora_400Regular' },
  mutedText: { fontSize: 13, color: Colors.textMuted, fontFamily: 'Sora_400Regular' },

  toneCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.lg, marginBottom: Spacing.md,
  },
  toneLabel: { ...Typography.label, color: Colors.textMuted, marginBottom: 8 },
  toneEmoji: { fontSize: 28, marginBottom: 4 },
  toneName: { ...Typography.headingM, color: Colors.textPrimary },

  topicsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.md },
  topicChip: {
    backgroundColor: Colors.neonBlue + '11', borderWidth: 1,
    borderColor: Colors.neonBlue + '33', borderRadius: Radius.full,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  topicText: { fontSize: 11, color: Colors.neonBlue, fontFamily: 'Sora_400Regular' },

  summaryActions: { flexDirection: 'row', gap: 10, marginTop: Spacing.md },
  actionBtn: {
    flex: 1, borderWidth: 1, borderRadius: Radius.md,
    paddingVertical: 12, alignItems: 'center',
  },

  transcriptCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg,
  },
  transcriptLabel: { ...Typography.label, color: Colors.textMuted, marginBottom: 12 },
  transcriptText: { fontSize: 13.5, color: Colors.textSecondary, lineHeight: 24, fontFamily: 'Sora_400Regular' },

  remindersHeader: { ...Typography.label, color: Colors.textMuted, marginBottom: 12 },
  reminderRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.lg, marginBottom: Spacing.sm,
  },
  reminderDot: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.neonBlue, marginTop: 1, flexShrink: 0 },
  reminderText: { flex: 1, fontSize: 13.5, color: Colors.textSecondary, fontFamily: 'Sora_400Regular', lineHeight: 21 },
  addReminderBtn: {
    borderWidth: 1, borderColor: Colors.neonBlue, borderRadius: Radius.md,
    paddingVertical: 14, alignItems: 'center', marginTop: 8, marginBottom: 12,
    backgroundColor: Colors.neonBlue + '11',
  },
  addReminderText: { fontFamily: 'Sora_700Bold', color: Colors.neonBlue },
  deleteBtn: {
    backgroundColor: Colors.red + '18', borderWidth: 1,
    borderColor: Colors.red + '44', borderRadius: Radius.md,
    paddingVertical: 14, alignItems: 'center',
  },
  deleteBtnText: { fontFamily: 'Sora_700Bold', color: Colors.red },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { ...Typography.bodyM, color: Colors.textMuted },
});
