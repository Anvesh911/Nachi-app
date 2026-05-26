// src/components/index.tsx

import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ViewStyle, ScrollView, Modal,
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { useColors, Typography, Spacing, Radius } from '../theme';
import { Conversation } from '../services/types';
import { formatDistanceToNow, format } from 'date-fns';

function ClockIcon({ color }: { color: string }) {
  return (
    <Svg width={11} height={11} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={2}/>
      <Path d="M12 6v6l4 2" stroke={color} strokeWidth={2} strokeLinecap="round"/>
    </Svg>
  );
}

function CalIcon({ color }: { color: string }) {
  return (
    <Svg width={11} height={11} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={4} width={18} height={17} rx={3} stroke={color} strokeWidth={2}/>
      <Path d="M8 2v3M16 2v3M3 9h18" stroke={color} strokeWidth={2} strokeLinecap="round"/>
    </Svg>
  );
}

function SearchIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Circle cx={11} cy={11} r={7} stroke="#9B8EC4" strokeWidth={2}/>
      <Path d="m16.5 16.5 3.5 3.5" stroke="#9B8EC4" strokeWidth={2} strokeLinecap="round"/>
    </Svg>
  );
}

function SettingsIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={3} stroke={color} strokeWidth={2}/>
      <Path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m2.12 2.12l4.24 4.24M4.22 19.78l4.24-4.24m2.12-2.12l4.24-4.24M1 12h6m6 0h6" stroke={color} strokeWidth={2} strokeLinecap="round"/>
    </Svg>
  );
}

export function Avatar({ initials, color, size = 42 }: {
  initials: string; color: string; size?: number;
}) {
  return (
    <View style={[styles.avatar, {
      width: size, height: size,
      borderRadius: size * 0.286,
      backgroundColor: color + '22',
      borderColor: color + '44',
    }]}>
      <Text style={[styles.avatarText, { color, fontSize: size * 0.31 }]}>{initials}</Text>
    </View>
  );
}

export function TagBadge({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.tag, { backgroundColor: color + '15', borderColor: color + '40' }]}>
      <Text style={[styles.tagText, { color }]}>{label}</Text>
    </View>
  );
}

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

export function GlassCard({ title, accentColor, children, style }: {
  title: string; accentColor: string;
  children: React.ReactNode; style?: ViewStyle;
}) {
  const C = useColors();
  return (
    <View style={[styles.glassCard, {
      backgroundColor: C.surface,
      borderColor: accentColor + '33',
      shadowColor: accentColor,
    }, style]}>
      <Text style={[styles.glassCardTitle, { color: accentColor }]}>{title}</Text>
      {children}
    </View>
  );
}

export type DateFilter = 'all' | 'today';

export function DateFilterBar({ active, onChange, onCalendarPress }: {
  active: DateFilter;
  onChange: (f: DateFilter) => void;
  onCalendarPress?: () => void;
}) {
  const C = useColors();

  const options: { key: DateFilter; label: string; Icon: any }[] = [
    { key: 'all', label: 'All Time', Icon: ClockIcon },
    { key: 'today', label: 'Today', Icon: CalIcon },
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.dateFilterContent}
    >
      {options.map((o) => {
        const isActive = active === o.key;
        const iconColor = isActive ? C.purple : C.textMuted;
        return (
          <TouchableOpacity
            key={o.key}
            onPress={() => onChange(o.key)}
            activeOpacity={0.7}
            style={[
              styles.dateFilterBtn,
              { borderColor: C.border, backgroundColor: C.surface },
              isActive && { borderColor: C.purple, backgroundColor: C.purplePale },
            ]}
          >
            <o.Icon color={iconColor} />
            <Text style={[styles.dateFilterText, { color: iconColor }]}>
              {o.label}
            </Text>
          </TouchableOpacity>
        );
      })}
      <TouchableOpacity
        onPress={onCalendarPress}
        activeOpacity={0.7}
        style={[
          styles.dateFilterBtn,
          { borderColor: C.border, backgroundColor: C.surface },
        ]}
      >
        <CalIcon color={C.textMuted} />
        <Text style={[styles.dateFilterText, { color: C.textMuted }]}>
          Calendar
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

export function applyDateFilter(conversations: Conversation[], filter: DateFilter): Conversation[] {
  if (filter === 'all') return conversations;
  const now = new Date();
  return conversations.filter((c) => {
    const d = new Date(c.date);
    if (filter === 'today') return d.toDateString() === now.toDateString();
    return true;
  });
}

function highlightMatch(text: string, query: string, C: any): React.ReactNode {
  const snippet = text.slice(0, 80);
  if (!query) return <Text style={[styles.convSnippet, { color: C.textMuted }]}>{snippet}...</Text>;
  
  try {
    const lower = text.toLowerCase();
    const idx = lower.indexOf(query.toLowerCase());
    if (idx === -1) return <Text style={[styles.convSnippet, { color: C.textMuted }]}>{snippet}...</Text>;

    const start = Math.max(0, idx - 20);
    const end = Math.min(text.length, idx + query.length + 40);
    const before = (start > 0 ? '...' : '') + text.slice(start, idx);
    const match = text.slice(idx, idx + query.length);
    const after = text.slice(idx + query.length, end) + (end < text.length ? '...' : '');

    return (
      <Text style={[styles.convSnippet, { color: C.textMuted }]}>
        {before}
        <Text style={{ backgroundColor: C.purple + '33', color: C.purple }}>{match}</Text>
        {after}
      </Text>
    );
  } catch (error) {
    console.error('Error highlighting match:', error);
    return <Text style={[styles.convSnippet, { color: C.textMuted }]}>{snippet}...</Text>;
  }
}

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
  try { timeAgo = formatDistanceToNow(new Date(c.date), { addSuffix: true }); } catch (error) { 
    console.error('Error formatting date:', error);
    timeAgo = ''; 
  }

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={500}
      style={[styles.convCard, {
        backgroundColor: C.surface,
        borderColor: C.border,
        shadowColor: C.purple,
      }]}
    >
      <View style={styles.convCardInner}>
        <Avatar initials={c.avatar} color={c.avatarColor} />
        <View style={styles.convContent}>
          <View style={styles.convTop}>
            <Text style={[styles.convContact, { color: C.textPrimary }]} numberOfLines={1}>{c.contact}</Text>
            <Text style={[styles.convTime, { color: C.textMuted }]}>{timeAgo}</Text>
          </View>
          <View style={{ marginBottom: 8 }}>
            {highlightMatch(c.transcript, searchQuery, C)}
          </View>
          <View style={styles.convBottom}>
            <View style={styles.convTagRow}>
              <TagBadge label={c.tag} color={c.tagColor} />
              <Text style={[styles.convDuration, { color: C.textMuted }]}>
                ⏱ {c.durationLabel}
              </Text>
            </View>
            <TouchableOpacity onPress={onStar} hitSlop={12} style={styles.starBtn}>
              <Text style={{ fontSize: 15, opacity: c.starred ? 1 : 0.3 }}>⭐</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export function LiveDot() {
  const C = useColors();
  return (
    <View style={styles.liveRow}>
      <View style={[styles.liveDot, { backgroundColor: C.green, shadowColor: C.green }]} />
      <Text style={[styles.liveText, { color: C.green }]}>SECURE</Text>
    </View>
  );
}

export function SettingsIconButton({ onPress, color }: { onPress: () => void; color: string }) {
  return (
    <TouchableOpacity onPress={onPress} hitSlop={12}>
      <SettingsIcon color={color} />
    </TouchableOpacity>
  );
}

export { SearchIcon };

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
      <View style={[savedStyles.card, {
        backgroundColor: C.surface,
        borderColor: C.border,
        shadowColor: C.purple,
      }]}>
        <Text style={savedStyles.icon}>✅</Text>
        <Text style={[savedStyles.title, { color: C.textPrimary }]}>Saved Successfully</Text>
        <Text style={[savedStyles.subtitle, { color: C.textMuted }]}>
          Recording with {contactName} has been saved.
        </Text>
        <TouchableOpacity
          style={[savedStyles.primaryBtn, { backgroundColor: C.purple }]}
          onPress={onViewSummary}
        >
          <Text style={savedStyles.primaryBtnText}>📋  View Summary</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[savedStyles.secondaryBtn, { borderColor: C.border }]}
          onPress={onViewTranscript}
        >
          <Text style={[savedStyles.secondaryBtnText, { color: C.textSecondary }]}>📝  View Transcript</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[savedStyles.secondaryBtn, { borderColor: C.border }]}
          onPress={onDismiss}
        >
          <Text style={[savedStyles.secondaryBtnText, { color: C.textSecondary }]}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: 'Nunito_700Bold' },
  tag: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, flexShrink: 0 },
  tagText: { fontSize: 10, fontFamily: 'Nunito_600SemiBold' },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  sectionLabel: { fontSize: 12, fontFamily: 'Nunito_700Bold', letterSpacing: 1.5 },
  sectionCount: { fontSize: 11, fontFamily: 'Nunito_600SemiBold' },
  glassCard: { borderWidth: 1.5, borderRadius: Radius.lg, padding: Spacing.lg, gap: 12, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  glassCardTitle: { fontSize: 13, fontFamily: 'Nunito_700Bold', letterSpacing: 1.5 },
  dateFilterContent: { paddingHorizontal: 16, gap: 10, paddingVertical: 12 },
  dateFilterBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderRadius: Radius.full, paddingHorizontal: 14, paddingVertical: 8, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  dateFilterText: { fontSize: 12, fontFamily: 'Nunito_600SemiBold' },
  convCard: { borderWidth: 1.5, borderRadius: Radius.lg, paddingHorizontal: 12, paddingVertical: 12, marginBottom: 10, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  convCardInner: { flexDirection: 'row', gap: 12 },
  convContent: { flex: 1, justifyContent: 'space-between', gap: 8 },
  convTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  convContact: { fontSize: 14, fontFamily: 'Nunito_700Bold', flex: 1 },
  convTime: { fontSize: 11, fontFamily: 'Outfit_400Regular' },
  convSnippet: { fontSize: 12, fontFamily: 'Outfit_400Regular', lineHeight: 18 },
  convBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  convTagRow: { flexDirection: 'row', gap: 8, alignItems: 'center', flex: 1 },
  convDuration: { fontSize: 10, fontFamily: 'Outfit_400Regular' },
  starBtn: { padding: 4 },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 8, height: 8, borderRadius: 4, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 2 },
  liveText: { fontSize: 10, fontFamily: 'Nunito_800ExtraBold', letterSpacing: 1.5 },
});

const savedStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#00000088', justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: { width: '100%', maxWidth: 360, borderWidth: 1.5, borderRadius: Radius.xxl, padding: Spacing.xxl, alignItems: 'center', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 12 },
  icon: { fontSize: 44, marginBottom: 12 },
  title: { fontSize: 18, fontFamily: 'Nunito_700Bold', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 13, fontFamily: 'Outfit_400Regular', marginBottom: 20, textAlign: 'center', lineHeight: 20 },
  primaryBtn: { width: '100%', borderRadius: Radius.lg, paddingVertical: 12, alignItems: 'center', marginBottom: 10 },
  primaryBtnText: { fontSize: 14, fontFamily: 'Nunito_700Bold', color: '#FFFFFF' },
  secondaryBtn: { width: '100%', borderWidth: 1.5, borderRadius: Radius.lg, paddingVertical: 12, alignItems: 'center', marginBottom: 10 },
  secondaryBtnText: { fontSize: 14, fontFamily: 'Nunito_600SemiBold' },
});
