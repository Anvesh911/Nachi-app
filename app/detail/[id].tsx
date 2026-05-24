// app/detail/[id].tsx

import { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  Share, Alert, Animated, TextInput, Modal,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useColors, Typography, Spacing, Radius, Shadow } from '../../src/theme';
import { useStore } from '../../src/store/useStore';
import { Avatar, TagBadge, GlassCard } from '../../src/components';
import { Conversation, Reminder, Task, DatePlan } from '../../src/services/types';
import { format } from 'date-fns';

type DetailTab = 'summary' | 'transcript' | 'reminders';

const MOOD_OPTIONS = [
  { emoji: '🤝', label: 'Collaborative' },
  { emoji: '💼', label: 'Professional' },
  { emoji: '🎉', label: 'Fun & Excited' },
  { emoji: '🏥', label: 'Medical' },
  { emoji: '❤️', label: 'Warm' },
  { emoji: '😔', label: 'Emotional' },
  { emoji: '😡', label: 'Tense' },
  { emoji: '😐', label: 'Neutral' },
];

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function DetailScreen() {
  const { id, tab } = useLocalSearchParams<{ id: string; tab?: string }>();
  const insets = useSafeAreaInsets();
  const C      = useColors();
  const { conversations, toggleStar, removeConversation } = useStore();
  const conv   = conversations.find((c) => c.id === id);

  const initialTab: DetailTab =
    tab === 'transcript' ? 'transcript' :
    tab === 'reminders'  ? 'reminders'  : 'summary';

  const [activeTab, setActiveTab]       = useState<DetailTab>(initialTab);
  const [isPlaying, setIsPlaying]       = useState(false);
  const [playProgress, setPlayProgress] = useState(0);
  const [exported, setExported]         = useState(false);

  const soundRef         = useRef<Audio.Sound | null>(null);
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const TABS: DetailTab[] = ['summary', 'transcript', 'reminders'];

  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync();
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, []);

  if (!conv) {
    return (
      <View style={[styles.root, { backgroundColor: C.background, paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backIcon, { color: C.purple }]}>‹</Text>
        </TouchableOpacity>
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>❓</Text>
          <Text style={[styles.emptyText, { color: C.textMuted }]}>Conversation not found.</Text>
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
        setIsPlaying(true); setPlayProgress(0);
        progressInterval.current = setInterval(() => {
          setPlayProgress((p) => {
            if (p >= 1) { setIsPlaying(false); if (progressInterval.current) clearInterval(progressInterval.current); return 0; }
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
        const { sound } = await Audio.Sound.createAsync({ uri: conv.audioFilePath }, { shouldPlay: true });
        soundRef.current = sound;
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded) {
            const prog = status.durationMillis ? status.positionMillis / status.durationMillis : 0;
            setPlayProgress(prog);
            if (status.didJustFinish) { setIsPlaying(false); setPlayProgress(0); }
          }
        });
      } else { await soundRef.current.playAsync(); }
      setIsPlaying(true);
    }
  }

  async function handleExport() {
    const text =
      `Nachi — Conversation with ${conv.contact}\n` +
      `Date: ${format(new Date(conv.date), 'dd MMM yyyy, hh:mm a')}\n` +
      `Duration: ${conv.durationLabel} · Tag: ${conv.tag}\n\n` +
      `=== TRANSCRIPT ===\n${conv.transcript}\n\n` +
      `=== SUMMARY ===\n` +
      `Key Points:\n${conv.summary.keyPoints.map((p) => `• ${p}`).join('\n')}\n\n` +
      `Tasks:\n${(conv.summary.tasks ?? []).map((t) => `${t.completed ? '✓' : '□'} ${t.text}`).join('\n')}\n\n` +
      `Dates:\n${conv.summary.dates.map((d) => `◆ ${d}`).join('\n')}\n\n` +
      `Reminders:\n${conv.summary.reminders.map((r) => `→ ${r}`).join('\n')}`;
    await Share.share({ message: text, title: `Nachi — ${conv.contact}` });
    setExported(true);
    setTimeout(() => setExported(false), 2000);
  }

  async function handleDelete() {
    Alert.alert('Delete Conversation', `Delete conversation with ${conv.contact}? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await removeConversation(conv.id); router.back(); } },
    ]);
  }

  const dateStr = format(new Date(conv.date), 'dd MMM yyyy');
  const timeStr = format(new Date(conv.date), 'hh:mm a');

  return (
    <View style={[styles.root, { backgroundColor: C.background, paddingTop: insets.top }]}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backIcon, { color: C.purple }]}>‹</Text>
        </TouchableOpacity>
        <Avatar initials={conv.avatar} color={conv.avatarColor} size={36} />
        <View style={styles.headerMeta}>
          <Text style={[styles.headerName, { color: C.textPrimary }]} numberOfLines={1}>{conv.contact}</Text>
          <Text style={[styles.headerSub, { color: C.textMuted }]}>{dateStr} · {timeStr} · {conv.durationLabel}</Text>
        </View>
        <TouchableOpacity onPress={() => toggleStar(conv.id)} hitSlop={8}>
          <Text style={{ fontSize: 20, opacity: conv.starred ? 1 : 0.35 }}>⭐</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleExport} hitSlop={8} style={{ marginLeft: 8 }}>
          <Text style={{ fontSize: 18, color: C.purple }}>⬆</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDelete} hitSlop={8} style={{ marginLeft: 8 }}>
          <Text style={{ fontSize: 18, color: C.red }}>🗑</Text>
        </TouchableOpacity>
      </View>

      {exported && (
        <View style={[styles.exportedBanner, { backgroundColor: C.purple + '18', borderColor: C.purple + '44' }]}>
          <Text style={[styles.exportedText, { color: C.purple }]}>✓ Transcript shared</Text>
        </View>
      )}

      {/* Audio player */}
      <View style={[styles.player, {
        backgroundColor: C.surface,
        borderColor: C.border,
        ...Shadow.card,
        shadowColor: C.purple,
      }]}>
        <TouchableOpacity onPress={togglePlay} style={[styles.playBtn, { backgroundColor: C.purple }]}>
          <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶'}</Text>
        </TouchableOpacity>
        <View style={styles.playerTrack}>
          <View style={[styles.trackBg, { backgroundColor: C.border }]}>
            <View style={[styles.trackFill, { backgroundColor: C.purple, width: `${playProgress * 100}%` }]} />
          </View>
          <View style={styles.trackTimes}>
            <Text style={[styles.trackTime, { color: C.textMuted }]}>{formatDur(Math.floor(playProgress * conv.durationSeconds))}</Text>
            <Text style={[styles.trackTime, { color: C.textMuted }]}>{conv.durationLabel}</Text>
          </View>
        </View>
      </View>

      {/* Tab bar */}
      <View style={[styles.tabBar, { backgroundColor: C.surfaceVariant, borderColor: C.border }]}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t}
            style={[
              styles.tabItem,
              activeTab === t && { backgroundColor: C.surface, borderRadius: Radius.md },
            ]}
            onPress={() => { setActiveTab(t); Haptics.selectionAsync(); }}
          >
            <Text style={[styles.tabLabel, { color: activeTab === t ? C.purple : C.textMuted }]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
            {activeTab === t && (
              <View style={[styles.tabUnderline, { backgroundColor: C.purple }]} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab content */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false}>
        {activeTab === 'summary'    && <SummaryTab conv={conv} onDelete={handleDelete} />}
        {activeTab === 'transcript' && <TranscriptTab conv={conv} />}
        {activeTab === 'reminders'  && <RemindersTab conv={conv} />}
      </ScrollView>
    </View>
  );
}

// ─── Summary Tab ──────────────────────────────────────────────────────────────
function SummaryTab({ conv, onDelete }: { conv: Conversation; onDelete: () => void }) {
  const C = useColors();
  const {
    addKeyPoint, updateKeyPoint, deleteKeyPoint,
    toggleTask, addTask, deleteTask, updateTask,
    addDatePlan, deleteDatePlan,
    updateTone, addTag, removeTag,
  } = useStore();

  const [newKeyPoint, setNewKeyPoint]   = useState('');
  const [editKP, setEditKP]             = useState<{ index: number; text: string } | null>(null);
  const [newTask, setNewTask]           = useState('');
  const [editTask, setEditTask]         = useState<{ id: string; text: string } | null>(null);
  const [newPlanTitle, setNewPlanTitle] = useState('');
  const [newPlanDate, setNewPlanDate]   = useState('');
  const [newPlanTime, setNewPlanTime]   = useState('');
  const [newTag, setNewTag]             = useState('');
  const [showMoodPicker, setShowMoodPicker] = useState(false);

  const tags      = conv.summary.tags      ?? [];
  const tasks     = conv.summary.tasks     ?? [];
  const datePlans = conv.summary.datePlans ?? [];

  return (
    <>
      {/* Tag + date row */}
      <View style={styles.summaryTagRow}>
        <TagBadge label={conv.tag} color={conv.tagColor} />
        <Text style={[styles.summaryDate, { color: C.textMuted }]}>{format(new Date(conv.date), 'dd MMM yyyy')}</Text>
      </View>

      {/* ── Key Points ── */}
      <GlassCard title="🔑 Key Points" accentColor={C.purple}>
        {conv.summary.keyPoints.map((p, i) => (
          <View key={i} style={styles.editRow}>
            {editKP?.index === i ? (
              <TextInput
                style={[styles.editInput, { color: C.textPrimary, borderColor: C.border }]}
                value={editKP.text}
                onChangeText={(t) => setEditKP({ index: i, text: t })}
                onBlur={() => { updateKeyPoint(conv.id, i, editKP.text); setEditKP(null); }}
                autoFocus
              />
            ) : (
              <TouchableOpacity style={{ flex: 1 }} onPress={() => setEditKP({ index: i, text: p })}>
                <Text style={[styles.bulletText, { color: C.textSecondary }]}>· {p}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => deleteKeyPoint(conv.id, i)} hitSlop={8}>
              <Text style={{ color: C.red, fontSize: 16 }}>×</Text>
            </TouchableOpacity>
          </View>
        ))}
        <View style={styles.addRow}>
          <TextInput
            style={[styles.addInput, { color: C.textPrimary, borderColor: C.border }]}
            placeholder="Add key point..."
            placeholderTextColor={C.textMuted}
            value={newKeyPoint}
            onChangeText={setNewKeyPoint}
          />
          <TouchableOpacity
            onPress={() => { if (newKeyPoint.trim()) { addKeyPoint(conv.id, newKeyPoint.trim()); setNewKeyPoint(''); } }}
            style={[styles.addBtn, { backgroundColor: C.purple }]}
          >
            <Text style={styles.addBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </GlassCard>

      {/* ── Tasks ── */}
      <GlassCard title="✅ Tasks & Promises" accentColor={C.green}>
        {tasks.map((task) => (
          <View key={task.id} style={styles.editRow}>
            <TouchableOpacity onPress={() => toggleTask(conv.id, task.id)} style={{ marginRight: 8 }}>
              <Text style={{ fontSize: 18 }}>{task.completed ? '☑' : '☐'}</Text>
            </TouchableOpacity>
            {editTask?.id === task.id ? (
              <TextInput
                style={[styles.editInput, { color: C.textPrimary, borderColor: C.border, flex: 1 }]}
                value={editTask.text}
                onChangeText={(t) => setEditTask({ id: task.id, text: t })}
                onBlur={() => { updateTask(conv.id, task.id, editTask.text); setEditTask(null); }}
                autoFocus
              />
            ) : (
              <TouchableOpacity style={{ flex: 1 }} onPress={() => setEditTask({ id: task.id, text: task.text })}>
                <Text style={[styles.bulletText, { color: C.textSecondary, textDecorationLine: task.completed ? 'line-through' : 'none' }]}>
                  {task.text}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => deleteTask(conv.id, task.id)} hitSlop={8}>
              <Text style={{ color: C.red, fontSize: 16 }}>×</Text>
            </TouchableOpacity>
          </View>
        ))}
        <View style={styles.addRow}>
          <TextInput
            style={[styles.addInput, { color: C.textPrimary, borderColor: C.border }]}
            placeholder="Add task..."
            placeholderTextColor={C.textMuted}
            value={newTask}
            onChangeText={setNewTask}
          />
          <TouchableOpacity
            onPress={() => { if (newTask.trim()) { addTask(conv.id, newTask.trim()); setNewTask(''); } }}
            style={[styles.addBtn, { backgroundColor: C.green }]}
          >
            <Text style={styles.addBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </GlassCard>

      {/* ── Date Plans ── */}
      <GlassCard title="📅 Dates & Plans" accentColor={C.orange}>
        {datePlans.map((plan) => (
          <View key={plan.id} style={styles.editRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.bulletText, { color: C.textSecondary }]}>◆ {plan.title}</Text>
              {(plan.date || plan.time) && (
                <Text style={[styles.planSub, { color: C.textMuted }]}>
                  {[plan.date, plan.time, plan.location].filter(Boolean).join(' · ')}
                </Text>
              )}
            </View>
            <TouchableOpacity onPress={() => deleteDatePlan(conv.id, plan.id)} hitSlop={8}>
              <Text style={{ color: C.red, fontSize: 16 }}>×</Text>
            </TouchableOpacity>
          </View>
        ))}
        <View style={styles.addRow}>
          <TextInput
            style={[styles.addInput, { color: C.textPrimary, borderColor: C.border, flex: 1 }]}
            placeholder="Title..."
            placeholderTextColor={C.textMuted}
            value={newPlanTitle}
            onChangeText={setNewPlanTitle}
          />
          <TextInput
            style={[styles.addInput, { color: C.textPrimary, borderColor: C.border, width: 80 }]}
            placeholder="Date"
            placeholderTextColor={C.textMuted}
            value={newPlanDate}
            onChangeText={setNewPlanDate}
          />
        </View>
        <TouchableOpacity
          onPress={() => {
            if (newPlanTitle.trim()) {
              addDatePlan(conv.id, { title: newPlanTitle.trim(), date: newPlanDate, time: newPlanTime });
              setNewPlanTitle(''); setNewPlanDate(''); setNewPlanTime('');
            }
          }}
          style={[styles.addBtn, { backgroundColor: C.orange, alignSelf: 'flex-end', marginTop: 6 }]}
        >
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </GlassCard>

      {/* ── Emotional Tone ── */}
      <TouchableOpacity
        style={[styles.toneCard, { backgroundColor: C.surface, borderColor: C.border }]}
        onPress={() => setShowMoodPicker(true)}
        activeOpacity={0.8}
      >
        <Text style={[styles.toneLabel, { color: C.textMuted }]}>EMOTIONAL TONE  ✏️</Text>
        <Text style={styles.toneEmoji}>{conv.summary.toneEmoji}</Text>
        <Text style={[styles.toneName, { color: C.textPrimary }]}>{conv.summary.tone}</Text>
        {conv.summary.toneDescription ? (
          <Text style={[styles.toneDesc, { color: C.textMuted }]}>{conv.summary.toneDescription}</Text>
        ) : null}
      </TouchableOpacity>

      {/* Mood Picker Modal */}
      <Modal visible={showMoodPicker} transparent animationType="fade" onRequestClose={() => setShowMoodPicker(false)}>
        <View style={styles.moodBackdrop}>
          <View style={[styles.moodCard, {
            backgroundColor: C.surface,
            borderColor: C.border,
            ...Shadow.purple,
          }]}>
            <Text style={[Typography.headingM, { color: C.textPrimary, marginBottom: 16 }]}>Select Mood</Text>
            <View style={styles.moodGrid}>
              {MOOD_OPTIONS.map((m) => (
                <TouchableOpacity
                  key={m.emoji}
                  style={[styles.moodOption, { borderColor: C.border, backgroundColor: C.surfaceVariant }]}
                  onPress={() => { updateTone(conv.id, m.emoji, m.label); setShowMoodPicker(false); }}
                >
                  <Text style={{ fontSize: 28 }}>{m.emoji}</Text>
                  <Text style={{ fontSize: 10, color: C.textMuted, fontFamily: 'Sora_400Regular', textAlign: 'center' }}>{m.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={() => setShowMoodPicker(false)} style={{ marginTop: 16, paddingVertical: 8 }}>
              <Text style={{ color: C.textMuted, fontFamily: 'Sora_400Regular', fontSize: 13 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Tags ── */}
      <View style={[styles.tagsCard, { backgroundColor: C.surface, borderColor: C.border }]}>
        <Text style={[styles.toneLabel, { color: C.textMuted }]}>TAGS</Text>
        <View style={styles.tagsRow}>
          {tags.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tagChip, { backgroundColor: C.purplePale, borderColor: C.purple + '44' }]}
              onPress={() => removeTag(conv.id, t)}
            >
              <Text style={{ fontSize: 11, color: C.purple, fontFamily: 'Sora_600SemiBold' }}>#{t} ×</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.addRow}>
          <TextInput
            style={[styles.addInput, { color: C.textPrimary, borderColor: C.border }]}
            placeholder="Add tag..."
            placeholderTextColor={C.textMuted}
            value={newTag}
            onChangeText={setNewTag}
            autoCapitalize="none"
          />
          <TouchableOpacity
            onPress={() => { if (newTag.trim()) { addTag(conv.id, newTag.trim().toLowerCase()); setNewTag(''); } }}
            style={[styles.addBtn, { backgroundColor: C.purple }]}
          >
            <Text style={styles.addBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Topics */}
      <View style={styles.topicsRow}>
        {conv.topics.map((t) => (
          <View key={t} style={[styles.topicChip, { backgroundColor: C.purplePale, borderColor: C.purple + '33' }]}>
            <Text style={[styles.topicText, { color: C.purple }]}>#{t}</Text>
          </View>
        ))}
      </View>

      {/* Delete */}
      <View style={styles.summaryActions}>
        <TouchableOpacity style={[styles.actionBtn, { borderColor: C.red + '44' }]} onPress={onDelete}>
          <Text style={{ color: C.red, fontFamily: 'Sora_600SemiBold', fontSize: 13 }}>🗑 Delete</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

// ─── Transcript Tab ───────────────────────────────────────────────────────────
function TranscriptTab({ conv }: { conv: Conversation }) {
  const C = useColors();
  return (
    <View style={[styles.transcriptCard, { backgroundColor: C.surface, borderColor: C.border }]}>
      <Text style={[styles.transcriptLabel, { color: C.textMuted }]}>FULL TRANSCRIPT</Text>
      <Text style={[styles.transcriptText, { color: C.textSecondary }]}>{conv.transcript}</Text>
    </View>
  );
}

// ─── Reminders Tab ────────────────────────────────────────────────────────────
function RemindersTab({ conv }: { conv: Conversation }) {
  const C = useColors();
  const { reminders, loadReminders, addReminder, toggleReminderCompleted, removeReminder } = useStore();

  const [showAdd, setShowAdd]               = useState(false);
  const [title, setTitle]                   = useState('');
  const [notes, setNotes]                   = useState('');
  const [date, setDate]                     = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [repeat, setRepeat]                 = useState<Reminder['repeat']>('none');

  useEffect(() => { loadReminders(conv.id); }, [conv.id]);

  const convReminders = reminders.filter((r) => r.conversationId === conv.id);
  const REPEAT_OPTIONS: Reminder['repeat'][] = ['none', 'daily', 'weekly', 'monthly'];

  async function handleAdd() {
    if (!title.trim()) return;
    await addReminder(conv.id, title.trim(), notes.trim(), date, repeat);
    setTitle(''); setNotes(''); setDate(new Date()); setRepeat('none'); setShowAdd(false);
  }

  return (
    <>
      {/* Existing text reminders from summary */}
      {conv.summary.reminders.length > 0 && (
        <View style={[styles.transcriptCard, { backgroundColor: C.surface, borderColor: C.border, marginBottom: Spacing.md }]}>
          <Text style={[styles.transcriptLabel, { color: C.textMuted }]}>FROM SUMMARY</Text>
          {conv.summary.reminders.map((r, i) => (
            <View key={i} style={styles.editRow}>
              <Text style={{ color: C.textDim, marginRight: 8 }}>→</Text>
              <Text style={[styles.bulletText, { color: C.textSecondary }]}>{r}</Text>
            </View>
          ))}
        </View>
      )}

      <Text style={[styles.remindersHeader, { color: C.textMuted }]}>SCHEDULED REMINDERS</Text>

      {convReminders.map((r) => (
        <View key={r.id} style={[styles.reminderRow, { backgroundColor: C.surface, borderColor: C.border }]}>
          <TouchableOpacity onPress={() => toggleReminderCompleted(r.id)} style={{ marginRight: 12 }}>
            <Text style={{ fontSize: 20 }}>{r.completed ? '☑' : '☐'}</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.reminderText, {
              color: r.completed ? C.textMuted : C.textSecondary,
              textDecorationLine: r.completed ? 'line-through' : 'none',
            }]}>
              {r.title}
            </Text>
            <Text style={[styles.planSub, { color: C.textMuted }]}>
              {format(new Date(r.scheduledDate), 'dd MMM • hh:mm a')}
              {r.repeat !== 'none' ? ` · ${r.repeat}` : ''}
            </Text>
            {r.notes ? <Text style={[styles.planSub, { color: C.textDim }]}>{r.notes}</Text> : null}
          </View>
          <TouchableOpacity onPress={() => removeReminder(r.id)} hitSlop={8}>
            <Text style={{ color: C.red, fontSize: 16 }}>×</Text>
          </TouchableOpacity>
        </View>
      ))}

      {convReminders.length === 0 && (
        <Text style={[styles.mutedText, { color: C.textMuted, marginBottom: Spacing.lg }]}>
          No scheduled reminders yet.
        </Text>
      )}

      {/* Add Reminder form */}
      {showAdd ? (
        <View style={[styles.addReminderForm, { backgroundColor: C.surface, borderColor: C.border }]}>
          <Text style={[Typography.headingS, { color: C.textPrimary, marginBottom: 12 }]}>New Reminder</Text>

          <TextInput
            style={[styles.formInput, { color: C.textPrimary, borderColor: C.border }]}
            placeholder="Reminder title *"
            placeholderTextColor={C.textMuted}
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            style={[styles.formInput, { color: C.textPrimary, borderColor: C.border }]}
            placeholder="Notes (optional)"
            placeholderTextColor={C.textMuted}
            value={notes}
            onChangeText={setNotes}
          />

          {/* FIX: Date picker — merges selected date, preserves existing time */}
          <TouchableOpacity
            style={[styles.formInput, { borderColor: C.border, justifyContent: 'center' }]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={{ color: C.textSecondary, fontFamily: 'Sora_400Regular', fontSize: 13 }}>
              📅 {format(date, 'dd MMM yyyy')}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              minimumDate={new Date()}
              onChange={(_, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  const merged = new Date(date);
                  merged.setFullYear(selectedDate.getFullYear());
                  merged.setMonth(selectedDate.getMonth());
                  merged.setDate(selectedDate.getDate());
                  setDate(merged);
                }
              }}
            />
          )}

          {/* FIX: Time picker — merges selected time, preserves existing date */}
          <TouchableOpacity
            style={[styles.formInput, { borderColor: C.border, justifyContent: 'center' }]}
            onPress={() => setShowTimePicker(true)}
          >
            <Text style={{ color: C.textSecondary, fontFamily: 'Sora_400Regular', fontSize: 13 }}>
              ⏰ {format(date, 'hh:mm a')}
            </Text>
          </TouchableOpacity>
          {showTimePicker && (
            <DateTimePicker
              value={date}
              mode="time"
              display="default"
              onChange={(_, selectedTime) => {
                setShowTimePicker(false);
                if (selectedTime) {
                  const merged = new Date(date);
                  merged.setHours(selectedTime.getHours());
                  merged.setMinutes(selectedTime.getMinutes());
                  merged.setSeconds(0);
                  setDate(merged);
                }
              }}
            />
          )}

          {/* Repeat */}
          <Text style={[styles.planSub, { color: C.textMuted, marginBottom: 6 }]}>Repeat</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
            {REPEAT_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt}
                onPress={() => setRepeat(opt)}
                style={[
                  styles.repeatBtn,
                  { borderColor: repeat === opt ? C.purple : C.border },
                  repeat === opt && { backgroundColor: C.purplePale },
                ]}
              >
                <Text style={{
                  fontSize: 11,
                  color: repeat === opt ? C.purple : C.textMuted,
                  fontFamily: 'Sora_600SemiBold',
                }}>
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              style={[styles.formBtn, { borderWidth: 1.5, borderColor: C.border, flex: 1 }]}
              onPress={() => setShowAdd(false)}
            >
              <Text style={{ color: C.textMuted, fontFamily: 'Sora_600SemiBold', fontSize: 13 }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.formBtn, { backgroundColor: C.purple, flex: 1 }]}
              onPress={handleAdd}
            >
              <Text style={{ color: '#FFFFFF', fontFamily: 'Sora_700Bold', fontSize: 13 }}>Save Reminder</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.addReminderBtn, { borderColor: C.purple, backgroundColor: C.purplePale }]}
          onPress={() => setShowAdd(true)}
        >
          <Text style={[styles.addReminderText, { color: C.purple }]}>+ Set Reminder</Text>
        </TouchableOpacity>
      )}
    </>
  );
}

function formatDur(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, gap: Spacing.sm },
  backBtn: { paddingRight: 4 },
  backIcon: { fontSize: 32, lineHeight: 36 },
  headerMeta: { flex: 1 },
  headerName: { ...Typography.headingM },
  headerSub: { fontSize: 11, fontFamily: 'Sora_400Regular' },
  exportedBanner: { borderWidth: 1, borderRadius: Radius.sm, marginHorizontal: Spacing.xl, marginBottom: Spacing.sm, paddingVertical: 8, alignItems: 'center' },
  exportedText: { fontSize: 12, fontFamily: 'Sora_600SemiBold' },
  player: { flexDirection: 'row', alignItems: 'center', borderRadius: Radius.lg, borderWidth: 1.5, marginHorizontal: Spacing.xl, marginBottom: Spacing.md, padding: 14, gap: 12 },
  playBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  playIcon: { fontSize: 18, color: '#FFF' },
  playerTrack: { flex: 1 },
  trackBg: { height: 4, borderRadius: 2, overflow: 'hidden', marginBottom: 4 },
  trackFill: { height: '100%', borderRadius: 2 },
  trackTimes: { flexDirection: 'row', justifyContent: 'space-between' },
  trackTime: { fontSize: 10, fontFamily: 'Sora_400Regular' },
  tabBar: { flexDirection: 'row', borderRadius: Radius.md, borderWidth: 1.5, marginHorizontal: Spacing.xl, marginBottom: Spacing.md, padding: 3 },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 9 },
  tabLabel: { fontFamily: 'Sora_600SemiBold', fontSize: 12 },
  tabUnderline: { position: 'absolute', bottom: -3, height: 2, width: '60%', borderRadius: 1 },
  tabContent: { padding: Spacing.xl, paddingBottom: 100 },
  summaryTagRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  summaryDate: { fontSize: 11, fontFamily: 'Sora_400Regular' },
  editRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  editInput: { flex: 1, borderWidth: 1, borderRadius: Radius.sm, paddingHorizontal: 10, paddingVertical: 6, fontFamily: 'Sora_400Regular', fontSize: 13 },
  addRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  addInput: { flex: 1, borderWidth: 1, borderRadius: Radius.sm, paddingHorizontal: 10, paddingVertical: 8, fontFamily: 'Sora_400Regular', fontSize: 13 },
  addBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  addBtnText: { color: '#FFF', fontFamily: 'Sora_700Bold', fontSize: 16 },
  bulletText: { flex: 1, fontSize: 13, lineHeight: 21, fontFamily: 'Sora_400Regular' },
  planSub: { fontSize: 11, fontFamily: 'Sora_400Regular', marginTop: 2 },
  mutedText: { fontSize: 13, fontFamily: 'Sora_400Regular' },
  toneCard: { borderRadius: Radius.lg, borderWidth: 1.5, padding: Spacing.lg, marginBottom: Spacing.md },
  toneLabel: { ...Typography.label, marginBottom: 8 },
  toneEmoji: { fontSize: 28, marginBottom: 4 },
  toneName: { ...Typography.headingM },
  toneDesc: { fontSize: 12, fontFamily: 'Sora_400Regular', marginTop: 4 },
  tagsCard: { borderRadius: Radius.lg, borderWidth: 1.5, padding: Spacing.lg, marginBottom: Spacing.md },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  tagChip: { borderRadius: Radius.full, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  topicsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.md },
  topicChip: { borderWidth: 1, borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 3 },
  topicText: { fontSize: 11, fontFamily: 'Sora_400Regular' },
  summaryActions: { flexDirection: 'row', gap: 10, marginTop: Spacing.md },
  actionBtn: { flex: 1, borderWidth: 1.5, borderRadius: Radius.md, paddingVertical: 12, alignItems: 'center' },
  transcriptCard: { borderRadius: Radius.lg, borderWidth: 1.5, padding: Spacing.lg },
  transcriptLabel: { ...Typography.label, marginBottom: 12 },
  transcriptText: { fontSize: 13.5, lineHeight: 24, fontFamily: 'Sora_400Regular' },
  remindersHeader: { ...Typography.label, marginBottom: 12 },
  reminderRow: { flexDirection: 'row', alignItems: 'flex-start', borderRadius: Radius.md, borderWidth: 1.5, padding: Spacing.lg, marginBottom: Spacing.sm },
  reminderText: { fontSize: 13.5, fontFamily: 'Sora_400Regular', lineHeight: 21 },
  addReminderBtn: { borderWidth: 1.5, borderRadius: Radius.md, paddingVertical: 14, alignItems: 'center', marginTop: 8, marginBottom: 12 },
  addReminderText: { fontFamily: 'Sora_700Bold', fontSize: 14 },
  addReminderForm: { borderRadius: Radius.lg, borderWidth: 1.5, padding: Spacing.lg, marginBottom: Spacing.md },
  formInput: { borderWidth: 1.5, borderRadius: Radius.sm, paddingHorizontal: 12, paddingVertical: 10, fontFamily: 'Sora_400Regular', fontSize: 13, marginBottom: 10 },
  formBtn: { paddingVertical: 12, borderRadius: Radius.md, alignItems: 'center' },
  repeatBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radius.full, borderWidth: 1.5 },
  moodBackdrop: { flex: 1, backgroundColor: '#00000066', alignItems: 'center', justifyContent: 'center' },
  moodCard: { width: 320, borderRadius: Radius.xxl, borderWidth: 1.5, padding: Spacing.xxl, alignItems: 'center' },
  moodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  moodOption: { width: 72, alignItems: 'center', padding: 10, borderRadius: Radius.lg, borderWidth: 1.5, gap: 4 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { ...Typography.bodyM },
});
