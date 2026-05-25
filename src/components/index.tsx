// src/components/index.tsx

import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ViewStyle, ScrollView,
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { useColors, Typography, Spacing, Radius } from '../theme';
import { Conversation } from '../services/types';
import { formatDistanceToNow, format } from 'date-fns';

// ─── SVG Icons ────────────────────────────────────────────────────────────────

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

function CalWeekIcon({ color }: { color: string }) {
  return (
    <Svg width={11} height={11} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={4} width={18} height={17} rx={3} stroke={color} strokeWidth={2}/>
      <Path d="M8 2v3M16 2v3M3 9h18M8 14h.01M12 14h.01M16 14h.01" stroke={color} strokeWidth={2} strokeLinecap="round"/>
    </Svg>
  );
}

function CalMonthIcon({ color }: { color: string }) {
  return (
    <Svg width={11} height={11} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={4} width={18} height={17} rx={3} stroke={color} strokeWidth={2}/>
      <Path d="M8 2v3M16 2v3M3 9h18" stroke={color} strokeWidth={2} strokeLinecap="round"/>
      <Circle cx={12} cy={15} r={3} stroke={color} strokeWidth={2}/>
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

// ─── Avatar ───────────────────────────────────────────────────────────────────
export function Avatar({ initials, color, size = 42 }: {
  initials: string; color: string; size?: number;
}) {
  return (
    <View style={[styles.avatar, {
      width: size, height: size,
      borderRadius: size * 0.286, // matches HTML: border-radius: 12px on 42px = 0.286
      backgroundColor: color + '22',
      borderColor: color + '44',
    }]}>
      <Text style={[styles.avatarText, { color, fontSize: size * 0.31 }]}>{initials}</Text>
    </View>
  );
}

// ─── TagBadge ─────────────────────────────────────────────────────────────────
export function TagBadge({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.tag, { backgroundColor: color + '15', borderColor: color + '40' }]}>
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

// ─── DateFilterBar — horizontal compact chips with SVG icons ─────────────────
export type DateFilter = 'all' | 'today' | 'week' | 'month';

export function DateFilterBar({ active, onChange }: {
  active: DateFilter;
  onChange: (f: DateFilter) => void;
}) {
  const C = useColors();

  const options: { key: DateFilter; label: string; Icon: any }[] = [
    { key: 'all',   label: 'All Time',   Icon: ClockIcon    },
    { key: 'today', label: 'Today',      Icon: CalIcon      },
    { key: 'week',  label: 'This Week',  Icon: CalWeekIcon  },
    { key: 'month', label: 'This Month', Icon: CalMonthIcon },
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
  if (!query) return <Text style={[styles.convSnippet, { color: C.textMuted }]}>{snippet}...</Text>;
  const lower = text.toLowerCase();
  const idx   = lower.indexOf(query.toLowerCase());
  if (idx === -1) return <Text style={[styles.convSnippet, { color: C.textMuted }]}>{snippet}...</Text>;

  const start  = Math.max(0, idx - 20);
  const end    = Math.min(text.length, idx + query.length + 40);
  const before = (start > 0 ? '...' : '') + text.slice(start, idx);
  const match  = text.slice(idx, idx + query.length);
  const after  = text.slice(idx + query.length, end) + (end < text.length ? '...' : '');

  return (
    <Text style={[styles.convSnippet, { color: C.textMuted }]}>
      {before}
      <Text style={{ backgroundColor: C.purple + '33', color: C.purple }}>{match}</Text>
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

// ─── SearchBarIcon export ─────────────────────────────────────────────────────
export { SearchIcon };

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

  // tag badge — from HTML: padding: 2px 9px, border-radius: 99px, border: 1.5px
  tag: { borderRadius: Radius.full, borderWidth: 1.5, paddingHorizontal: 9, paddingVertical: 2 },
  tagText: { fontSize: 10, fontFamily: 'Sora_700Bold' },

  sectionRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 18, marginBottom: 9,
  },
  sectionLabel: {
    fontSize: 11, fontFamily: 'Sora_700Bold',
    letterSpacing: 1.5, textTransform: 'uppercase',
  },
  sectionCount: { fontSize: 11, fontFamily: 'Sora_600SemiBold' },

  glassCard: {
    borderRadius: Radius.lg, borderWidth: 1.5,
    padding: Spacing.lg, marginBottom: Spacing.md,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  glassCardTitle: { ...Typography.label, marginBottom: Spacing.sm },

  // date filter chips — from HTML: height:30px, padding: 6px 12px, gap:5px
  dateFilterContent: {
    paddingHorizontal: Spacing.xl,
    gap: 7,
    paddingBottom: 12,
    alignItems: 'center',
  },
  dateFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    height: 30,
  },
  dateFilterText: { fontSize: 11, fontFamily: 'Sora_700Bold' },

  // conv card — from HTML: border-radius:18px, padding:14px, gap:11px, border:1.5px
  convCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    marginBottom: 8,
    padding: 14,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  convCardInner: { flexDirection: 'row', gap: 11 },
  convContent: { flex: 1 },
  convTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  // cname: font-size:14px, font-weight:800
  convContact: { fontSize: 14, fontFamily: 'Sora_700Bold', flex: 1 },
  // ctime: font-size:10px, font-weight:600
  convTime: { fontSize: 10, fontFamily: 'Sora_600SemiBold' },
  // csnip: font-size:12px, line-height:1.6
  convSnippet: { fontSize: 12, lineHeight: 19, fontFamily: 'Sora_400Regular' },
  convTagRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  convBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  convDuration: { fontSize: 10, fontFamily: 'Sora_600SemiBold' },
  starBtn: { padding: 4 },

  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: {
    width: 8, height: 8, borderRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1, shadowRadius: 4, elevation: 4,
  },
  liveText: { fontSize: 10, fontFamily: 'Sora_700Bold', letterSpacing: 1.5 },
});

const savedStyles = StyleSheet.create({
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#00000088',
    alignItems: 'center', justifyContent: 'center', zIndex: 999,
  },
  card: {
    width: 320, borderRadius: Radius.xxl, borderWidth: 1.5,
    padding: 28, alignItems: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15, shadowRadius: 24, elevation: 12,
  },
  icon: { fontSize: 48, marginBottom: 12 },
  title: { fontFamily: 'Sora_700Bold', fontSize: 20, marginBottom: 8 },
  subtitle: { fontFamily: 'Sora_400Regular', fontSize: 13, textAlign: 'center', marginBottom: 24 },
  primaryBtn: { width: '100%', borderRadius: Radius.md, paddingVertical: 14, alignItems: 'center', marginBottom: 10 },
  primaryBtnText: { fontFamily: 'Sora_700Bold', fontSize: 14, color: '#FFFFFF' },
  secondaryBtn: { width: '100%', borderWidth: 1.5, borderRadius: Radius.md, paddingVertical: 14, alignItems: 'center' },
  secondaryBtnText: { fontFamily: 'Sora_600SemiBold', fontSize: 14 },
  dismissText: { fontFamily: 'Sora_400Regular', fontSize: 13 },
});
