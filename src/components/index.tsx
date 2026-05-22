// src/components/index.tsx
// Shared UI components converted from Flutter widgets

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../theme';
import { Conversation } from '../services/types';
import { formatDistanceToNow } from 'date-fns';

// ─── Avatar ───────────────────────────────────────────────────────────────────
export function Avatar({
  initials,
  color,
  size = 42,
}: {
  initials: string;
  color: string;
  size?: number;
}) {
  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size * 0.33,
          backgroundColor: color + '28',
          borderColor: color + '44',
        },
      ]}
    >
      <Text style={[styles.avatarText, { color, fontSize: size * 0.33 }]}>
        {initials}
      </Text>
    </View>
  );
}

// ─── TagBadge ─────────────────────────────────────────────────────────────────
export function TagBadge({ label, color }: { label: string; color: string }) {
  return (
    <View
      style={[
        styles.tag,
        { backgroundColor: color + '18', borderColor: color + '44' },
      ]}
    >
      <Text style={[styles.tagText, { color }]}>{label}</Text>
    </View>
  );
}

// ─── SectionLabel ─────────────────────────────────────────────────────────────
export function SectionLabel({
  label,
  count,
}: {
  label: string;
  count?: number;
}) {
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
export function GlassCard({
  title,
  accentColor,
  children,
  style,
}: {
  title: string;
  accentColor: string;
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View
      style={[
        styles.glassCard,
        { borderColor: accentColor + '33' },
        style,
      ]}
    >
      <Text style={[styles.glassCardTitle, { color: accentColor }]}>
        {title}
      </Text>
      {children}
    </View>
  );
}

// ─── ConvCard ─────────────────────────────────────────────────────────────────
function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query) return <Text style={styles.convSnippet}>{text.slice(0, 80)}...</Text>;
  const lower = text.toLowerCase();
  const idx = lower.indexOf(query.toLowerCase());
  if (idx === -1) return <Text style={styles.convSnippet}>{text.slice(0, 80)}...</Text>;

  const start = Math.max(0, idx - 20);
  const end = Math.min(text.length, idx + query.length + 40);
  const before = (start > 0 ? '...' : '') + text.slice(start, idx);
  const match = text.slice(idx, idx + query.length);
  const after = text.slice(idx + query.length, end) + (end < text.length ? '...' : '');

  return (
    <Text style={styles.convSnippet}>
      {before}
      <Text style={styles.highlight}>{match}</Text>
      {after}
    </Text>
  );
}

export function ConvCard({
  conversation: c,
  onPress,
  onStar,
  searchQuery = '',
}: {
  conversation: Conversation;
  onPress: () => void;
  onStar: () => void;
  searchQuery?: string;
}) {
  const timeAgo = formatDistanceToNow(new Date(c.date), { addSuffix: true });

  return (
    <TouchableOpacity activeOpacity={0.75} onPress={onPress} style={styles.convCard}>
      <View style={styles.convCardInner}>
        <Avatar initials={c.avatar} color={c.avatarColor} />
        <View style={styles.convContent}>
          <View style={styles.convTop}>
            <Text style={styles.convContact} numberOfLines={1}>
              {c.contact}
            </Text>
            <Text style={styles.convTime}>{timeAgo}</Text>
          </View>
          <View style={{ marginBottom: 8 }}>
            {highlightMatch(c.transcript, searchQuery)}
          </View>
          <View style={styles.convBottom}>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <TagBadge label={c.tag} color={c.tagColor} />
              <Text style={styles.convDuration}>⏱ {c.durationLabel}</Text>
            </View>
            <TouchableOpacity onPress={onStar} hitSlop={8}>
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

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  avatarText: {
    fontFamily: 'Sora_700Bold',
  },
  tag: {
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tagText: {
    fontSize: 11,
    fontFamily: 'Sora_600SemiBold',
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionLabel: {
    ...Typography.label,
    color: Colors.textMuted,
  },
  sectionCount: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: 'Sora_400Regular',
  },
  glassCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  glassCardTitle: {
    ...Typography.label,
    marginBottom: Spacing.sm,
  },
  convCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
    padding: Spacing.lg,
  },
  convCardInner: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  convContent: {
    flex: 1,
  },
  convTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  convContact: {
    ...Typography.headingS,
    color: Colors.textPrimary,
    flex: 1,
  },
  convTime: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: 'Sora_400Regular',
  },
  convSnippet: {
    fontSize: 12,
    color: Colors.textDim,
    lineHeight: 18,
    fontFamily: 'Sora_400Regular',
  },
  highlight: {
    backgroundColor: Colors.neonBlue + '33',
    color: Colors.neonBlue,
  },
  convBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  convDuration: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: 'Sora_400Regular',
  },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.green,
    shadowColor: Colors.green,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 4,
  },
  liveText: {
    fontSize: 10,
    color: Colors.green,
    fontFamily: 'Sora_600SemiBold',
    letterSpacing: 1.5,
  },
});
