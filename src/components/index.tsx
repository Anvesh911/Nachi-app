// src/components/index.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  ScrollView,
} from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../theme';
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
      <Text style={[styles.avatarText, { color, fontSize: size * 0.33 }]}>
        {initials}
      </Text>
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
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {count !== undefined && (
        <Text style={styles.sectionCount}>{count}</Text>
      )}
    </View>
  );
}

// ─── GlassCard ────────────────────────────────────────────────────────────────
export function GlassCard({ title, accentColor, children, style }: {
  title: string; accentColor: string;
  children: React.ReactNode; style?: ViewStyle;
}) {
  return (
    <View style={[styles.glassCard, { borderColor: accentColor + '33' }, style]}>
      <Text style={[styles.glassCardTitle, { color: accentColor }]}>{title}</Text>
      {children}
    </View>
  );
}

// ─── DateFilter ───────────────────────────────────────────────────────────────
export type DateFilter = 'all' | 'today' | 'week' | 'month';

export function DateFilterBar({
  active,
  onChange,
}: {
  active: DateFilter;
  onChange: (f: DateFilter) => void;
}) {
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
            active === o.key && styles.dateFilterBtnActive,
          ]}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.dateFilterText,
            active === o.key && styles.dateFilterTextActive,
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
    if (filter === 'today') {
      return d.toDateString() === now.toDateString();
    }
    if (filter === 'week') {
      const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
      return d >= weekAgo;
    }
    if (filter === 'month') {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    return true;
  });
}

// ─── highlight helper ─────────────────────────────────────────────────────────
function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query) return <Text style={styles.convSnippet}>{text.slice(0, 80)}...</Text>;
  const lower = text.toLowerCase();
  const idx = lower.indexOf(query.toLowerCase());
  if (idx === -1) return <Text style={styles.convSnippet}>{text.slice(0, 80)}...</Text>;

  const start = Math.max(0, idx - 20);
  const end   = Math.min(text.length, idx + query.length + 40);
  const before = (start > 0 ? '...' : '') + text.slice(start, idx);
  const match  = text.slice(idx, idx + query.length);
  const after  = text.slice(idx + query.length, end) + (end < text.length ? '...' : '');

  return (
    <Text style={styles.convSnippet}>
      {before}
      <Text style={styles.highlight}>{match}</Text>
      {after}
    </Text>
  );
}

// ─── ConvCard ─────────────────────────────────────────────────────────────────
export function ConvCard({
  conversation: c,
  onPress,
  onStar,
  onLongPress,
  searchQuery = '',
}: {
  conversation: Conversation;
  onPress: () => void;
  onStar: () => void;
  onLongPress?: () => void;
  searchQuery?: string;
}) {
  let timeAgo = '';
  try { timeAgo = formatDistanceToNow(new Date(c.date), { addSuffix: true }); } catch { timeAgo = ''; }

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={500}
      style={styles.convCard}
    >
      <View style={styles.convCardInner}>
        <Avatar initials={c.avatar} color={c.avatarColor} />
        <View style={styles.convContent}>
          {/* Top row */}
          <View style={styles.convTop}>
            <Text style={styles.convContact} numberOfLines={1}>{c.contact}</Text>
            <Text style={styles.convTime}>{timeAgo}</Text>
          </View>

          {/* Transcript snippet */}
          <View style={{ marginBottom: 6 }}>
            {highlightMatch(c.transcript, searchQuery)}
          </View>

          {/* Tag row */}
          <View style={styles.convTagRow}>
            <TagBadge label={c.tag} color={c.tagColor} />
            <Text style={styles.convDuration}>⏱ {c.durationLabel}</Text>
          </View>

          {/* Bottom actions */}
          <View style={styles.convBottom}>
            <Text style={styles.convDate}>
              {format(new Date(c.date), 'dd MMM yyyy')}
            </Text>
            {/* Star directly on card */}
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
  return (
    <View style={styles.liveRow}>
      <View style={styles.liveDot} />
      <Text style={styles.liveText}>SECURE</Text>
    </View>
  );
}

// ─── SavedModal ───────────────────────────────────────────────────────────────
// Post-recording confirmation modal with quick actions
export function SavedModal({
  visible,
  onViewSummary,
  onViewTranscript,
  onDismiss,
  contactName,
}: {
  visible: boolean;
  onViewSummary: () => void;
  onViewTranscript: () => void;
  onDismiss: () => void;
  contactName: string;
}) {
  if (!visible) return null;

  return (
    <View style={savedStyles.overlay}>
      <View style={savedStyles.card}>
        <Text style={savedStyles.icon}>✅</Text>
        <Text style={savedStyles.title}>Saved Successfully</Text>
        <Text style={savedStyles.subtitle}>
          Recording with {contactName} has been saved.
        </Text>

        <TouchableOpacity style={savedStyles.primaryBtn} onPress={onViewSummary}>
          <Text style={savedStyles.primaryBtnText}>📋  View Summary</Text>
        </TouchableOpacity>

        <TouchableOpacity style={savedStyles.secondaryBtn} onPress={onViewTranscript}>
          <Text style={savedStyles.secondaryBtnText}>📝  View Transcript</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onDismiss} style={{ marginTop: 12, paddingVertical: 8 }}>
          <Text style={savedStyles.dismissText}>Back to Home</Text>
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
  sectionLabel: { ...Typography.label, color: Colors.textMuted },
  sectionCount: { fontSize: 11, color: Colors.textMuted, fontFamily: 'Sora_400Regular' },
  glassCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.lg, marginBottom: Spacing.md },
  glassCardTitle: { ...Typography.label, marginBottom: Spacing.sm },

  // Date filter
  dateFilterContent: { paddingHorizontal: Spacing.xl, gap: 8, paddingBottom: 8 },
  dateFilterBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border },
  dateFilterBtnActive: { borderColor: Colors.purple, backgroundColor: Colors.purple + '18' },
  dateFilterText: { fontSize: 12, fontFamily: 'Sora_600SemiBold', color: Colors.textMuted },
  dateFilterTextActive: { color: Colors.purple },

  // ConvCard
  convCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.sm, padding: Spacing.lg },
  convCardInner: { flexDirection: 'row', gap: Spacing.md },
  convContent: { flex: 1 },
  convTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  convContact: { ...Typography.headingS, color: Colors.textPrimary, flex: 1 },
  convTime: { fontSize: 11, color: Colors.textMuted, fontFamily: 'Sora_400Regular' },
  convSnippet: { fontSize: 12, color: Colors.textDim, lineHeight: 18, fontFamily: 'Sora_400Regular' },
  highlight: { backgroundColor: Colors.neonBlue + '33', color: Colors.neonBlue },
  convTagRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  convBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  convDate: { fontSize: 11, color: Colors.textMuted, fontFamily: 'Sora_400Regular' },
  convDuration: { fontSize: 11, color: Colors.textMuted, fontFamily: 'Sora_400Regular' },
  starBtn: { padding: 4 },

  // LiveDot
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.green, shadowColor: Colors.green, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 4, elevation: 4 },
  liveText: { fontSize: 10, color: Colors.green, fontFamily: 'Sora_600SemiBold', letterSpacing: 1.5 },
});

const savedStyles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000000CC', alignItems: 'center', justifyContent: 'center', zIndex: 999 },
  card: { width: 320, backgroundColor: Colors.surface, borderRadius: Radius.xxl, borderWidth: 1, borderColor: Colors.border, padding: 28, alignItems: 'center' },
  icon: { fontSize: 48, marginBottom: 12 },
  title: { fontFamily: 'Sora_700Bold', fontSize: 20, color: Colors.textPrimary, marginBottom: 8 },
  subtitle: { fontFamily: 'Sora_400Regular', fontSize: 13, color: Colors.textMuted, textAlign: 'center', marginBottom: 24 },
  primaryBtn: { width: '100%', backgroundColor: Colors.neonBlue, borderRadius: Radius.md, paddingVertical: 14, alignItems: 'center', marginBottom: 10 },
  primaryBtnText: { fontFamily: 'Sora_700Bold', fontSize: 14, color: '#000' },
  secondaryBtn: { width: '100%', borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingVertical: 14, alignItems: 'center' },
  secondaryBtnText: { fontFamily: 'Sora_600SemiBold', fontSize: 14, color: Colors.textSecondary },
  dismissText: { fontFamily: 'Sora_400Regular', fontSize: 13, color: Colors.textMuted },
});
