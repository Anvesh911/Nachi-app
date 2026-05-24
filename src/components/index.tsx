// src/components/index.tsx

import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ViewStyle, ScrollView,
} from 'react-native';
import { useColors, Typography, Spacing, Radius } from '../theme';
import { Conversation } from '../services/types';
import { formatDistanceToNow, format } from 'date-fns';

// ─── Avatar ───────────────────────────────────────────────────────────────────
export function Avatar({ initials, color, size = 42 }: {
  initials: string; color: string; size?: number;
}) {
  return (
    <View style={[styles.avatar, {
      width: size, height: size,
      borderRadius: size * 0.33,
      backgroundColor: color + '28',
      borderColor: color + '44',
    }]}>
      <Text style={[styles.avatarText, { color, fontSize: size * 0.33 }]}>{initials}</Text>
    </View>
  );
}

// ─── TagBadge ─────────────────────────────────────────────────────────────────
export function TagBadge({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.tag, { backgroundColor: color + '18', borderColor: color + '44' }]}>
      <Text style={[styles.tagText, { color }]}>{label}</Text>
    </View>
  );
}

// ─── SectionLabel ─────────────────────────────────────────────────────────────
export function SectionLabel({ label, count }: { label: string; count?: number }) {
  const C = useColors();
  return (
    <View style={styles.sectionRow}>
      <Text style={[styles.sectionLabel, { color: C.textMuted }]}>{label}</Text>
      {count !== undefined && (
        <Text style={[styles.sectionCount, { color: C.textMuted }]}>{count}</Text>
      )}
    </View>
  );
}

// ─── GlassCard ────────────────────────────────────────────────────────────────
export function GlassCard({ title, accentColor, children, style }: {
  title: string; accentColor: string;
  children: React.ReactNode; style?: ViewStyle;
}) {
  const C = useColors();
  return (
    <View style={[styles.glassCard, { backgroundColor: C.surface, borderColor: accentColor + '33' }, style]}>
      <Text style={[styles.glassCardTitle, { color: accentColor }]}>{title}</Text>
      {children}
    </View>
  );
}

// ─── DateFilterBar ────────────────────────────────────────────────────────────
export type DateFilter = 'all' | 'today' | 'week' | 'month';

export function DateFilterBar({ active, onChange }: {
  active: DateFilter;
  onChange: (f: DateFilter) => void;
}) {
  const C = useColors();
  const options: { key: DateFilter; label: string }[] = [
    { key: 'all',   label: 'All Time' },
    { key: 'today', label: 'Today' },
    { key: 'week',  label: 'This Week' },
    { key: 'month', label: 'This Month' },
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.dateFilterContent}
    >
      {options.map((o) => (
        <TouchableOpacity
          key={o.key}
          onPress={() => onChange(o.key)}
          style={[
            styles.dateFilterBtn,
            { borderColor: C.border },
            active === o.key && { borderColor: C.purple, backgroundColor: C.purple + '18' },
          ]}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.dateFilterText,
            { color: active === o.key ? C.purple : C.textMuted },
          ]}>
            {o.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

export function applyDateFilter(conversations: Conversation[], filter: DateFilter): Conversation[] {
  if (filter === 'all') return conversations;
  const now = new Date();
  return conversations.filter((c) => {
    const d = new Date(c.date);
    if (filter === 'today') return d.toDateString() === now.toDateString();
    if (filter === 'week')  { const w = new Date(now); w.setDate(now.getDate() - 7); return d >= w; }
    if (filter === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    return true;
  });
}

// ─── highlight helper ─────────────────────────────────────────────────────────
function highlightMatch(text: string, query: string, C: any): React.ReactNode {
  const snippet = text.slice(0, 80);
  if (!query) return <Text style={[styles.convSnippet, { color: C.textDim }]}>{snippet}...</Text>;
  const lower = text.toLowerCase();
  const idx   = lower.indexOf(query.toLowerCase());
  if (idx === -1) return <Text style={[styles.convSnippet, { color: C.textDim }]}>{snippet}...</Text>;

  const start  = Math.max(0, idx - 20);
  const end    = Math.min(text.length, idx + query.length + 40);
  const before = (start > 0 ? '...' : '') + text.slice(start, idx);
  const match  = text.slice(idx, idx + query.length);
  const after  = text.slice(idx + query.length, end) + (end < text.length ? '...' : '');

  return (
    <Text style={[styles.convSnippet, { color: C.textDim }]}>
      {before}
      <Text style={{ backgroundColor: C.neonBlue + '33', color: C.neonBlue }}>{match}</Text>
      {after}
    </Text>
  );
}

// ─── ConvCard ─────────────────────────────────────────────────────────────────
export function ConvCard({
  conversation: c, onPress, onStar, onLongPress, searchQuery = '',
}: {
  conversation: Conversation;
  onPress: () => void;
  onStar: () => void;
  onLongPress?: () => void;
  searchQuery?: string;
}) {
  const C = useColors();
  let timeAgo = '';
  try { timeAgo = formatDistanceToNow(new Date(c.date), { addSuffix: true }); } catch { timeAgo = ''; }

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={500}
      style={[styles.convCard, { backgroundColor: C.surface, borderColor: C.border }]}
    >
      <View style={styles.convCardInner}>
        <Avatar initials={c.avatar} color={c.avatarColor} />
        <View style={styles.convContent}>
          <View style={styles.convTop}>
            <Text style={[styles.convContact, { color: C.textPrimary }]} numberOfLines={1}>{c.contact}</Text>
            <Text style={[styles.convTime, { color: C.textMuted }]}>{timeAgo}</Text>
          </View>
          <View style={{ marginBottom: 6 }}>
            {highlightMatch(c.transcript, searchQuery, C)}
          </View>
          <View style={styles.convTagRow}>
            <TagBadge label={c.tag} color={c.tagColor} />
            <Text style={[styles.convDuration, { color: C.textMuted }]}>⏱ {c.durationLabel}</Text>
          </View>
          <View style={styles.convBottom}>
            <Text style={[styles.convDate, { color: C.textMuted }]}>
              {format(new Date(c.date), 'dd MMM yyyy')}
            </Text>
            <TouchableOpacity onPress={onStar} hitSlop={12} style={styles.starBtn}>
              <Text style={{ fontSize: 16, opacity: c.starred ? 1 : 0.3 }}>⭐</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── LiveDot ──────────────────────────────────────────────────────────────────
export function LiveDot() {
  const C = useColors();
  return (
    <View style={styles.liveRow}>
      <View style={[styles.liveDot, { backgroundColor: C.green, shadowColor: C.green }]} />
      <Text style={[styles.liveText, { color: C.green }]}>SECURE</Text>
    </View>
  );
}

// ─── SavedModal ───────────────────────────────────────────────────────────────
export function SavedModal({ visible, onViewSummary, onViewTranscript, onDismiss, contactName }: {
  visible: boolean;
  onViewSummary: () => void;
  onViewTranscript: () => void;
  onDismiss: () => void;
  contactName: string;
}) {
  const C = useColors();
  if (!visible) return null;

  return (
    <View style={savedStyles.overlay}>
      <View style={[savedStyles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
        <Text style={savedStyles.icon}>✅</Text>
        <Text style={[savedStyles.title, { color: C.textPrimary }]}>Saved Successfully</Text>
        <Text style={[savedStyles.subtitle, { color: C.textMuted }]}>
          Recording with {contactName} has been saved.
        </Text>
        <TouchableOpacity style={[savedStyles.primaryBtn, { backgroundColor: C.neonBlue }]} onPress={onViewSummary}>
          <Text style={savedStyles.primaryBtnText}>📋  View Summary</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[savedStyles.secondaryBtn, { borderColor: C.border }]} onPress={onViewTranscript}>
          <Text style={[savedStyles.secondaryBtnText, { color: C.textSecondary }]}>📝  View Transcript</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onDismiss} style={{ marginTop: 12, paddingVertical: 8 }}>
          <Text style={[savedStyles.dismissText, { color: C.textMuted }]}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  avatar: { alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  avatarText: { fontFamily: 'Sora_700Bold' },
  tag: { borderRadius: Radius.full, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2 },
  tagText: { fontSize: 11, fontFamily: 'Sora_600SemiBold' },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sectionLabel: { ...Typography.label },
  sectionCount: { fontSize: 11, fontFamily: 'Sora_400Regular' },
  glassCard: { borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.lg, marginBottom: Spacing.md },
  glassCardTitle: { ...Typography.label, marginBottom: Spacing.sm },
  dateFilterContent: { paddingHorizontal: Spacing.xl, gap: 8, paddingBottom: 8 },
  dateFilterBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: Radius.full, borderWidth: 1 },
  dateFilterText: { fontSize: 12, fontFamily: 'Sora_600SemiBold' },
  convCard: { borderRadius: Radius.lg, borderWidth: 1, marginBottom: Spacing.sm, padding: Spacing.lg },
  convCardInner: { flexDirection: 'row', gap: Spacing.md },
  convContent: { flex: 1 },
  convTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  convContact: { ...Typography.headingS, flex: 1 },
  convTime: { fontSize: 11, fontFamily: 'Sora_400Regular' },
  convSnippet: { fontSize: 12, lineHeight: 18, fontFamily: 'Sora_400Regular' },
  convTagRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  convBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  convDate: { fontSize: 11, fontFamily: 'Sora_400Regular' },
  convDuration: { fontSize: 11, fontFamily: 'Sora_400Regular' },
  starBtn: { padding: 4 },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 8, height: 8, borderRadius: 4, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 4, elevation: 4 },
  liveText: { fontSize: 10, fontFamily: 'Sora_600SemiBold', letterSpacing: 1.5 },
});

const savedStyles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000000CC', alignItems: 'center', justifyContent: 'center', zIndex: 999 },
  card: { width: 320, borderRadius: Radius.xxl, borderWidth: 1, padding: 28, alignItems: 'center' },
  icon: { fontSize: 48, marginBottom: 12 },
  title: { fontFamily: 'Sora_700Bold', fontSize: 20, marginBottom: 8 },
  subtitle: { fontFamily: 'Sora_400Regular', fontSize: 13, textAlign: 'center', marginBottom: 24 },
  primaryBtn: { width: '100%', borderRadius: Radius.md, paddingVertical: 14, alignItems: 'center', marginBottom: 10 },
  primaryBtnText: { fontFamily: 'Sora_700Bold', fontSize: 14, color: '#000' },
  secondaryBtn: { width: '100%', borderWidth: 1, borderRadius: Radius.md, paddingVertical: 14, alignItems: 'center' },
  secondaryBtnText: { fontFamily: 'Sora_600SemiBold', fontSize: 14 },
  dismissText: { fontFamily: 'Sora_400Regular', fontSize: 13 },
});
