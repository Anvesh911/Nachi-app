// app/(tabs)/starred.tsx

import { useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, Typography, Spacing, Radius, Shadow } from '../../src/theme';
import { useStore } from '../../src/store/useStore';
import { ConvCard, SectionLabel } from '../../src/components';
import { Conversation } from '../../src/services/types';

export default function StarredScreen() {
  const insets  = useSafeAreaInsets();
  const C       = useColors();
  const { conversations, toggleStar } = useStore();
  const starred = conversations.filter((c) => c.starred);

  const renderItem = useCallback(
    ({ item }: { item: Conversation }) => (
      <ConvCard
        conversation={item}
        onPress={() => router.push(`/detail/${item.id}`)}
        onStar={() => toggleStar(item.id)}
      />
    ),
    [toggleStar]
  );

  return (
    <View style={[styles.root, { backgroundColor: C.background, paddingTop: insets.top }]}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.eyebrow, { color: C.textMuted }]}>SAVED</Text>
        <Text style={[styles.title, { color: C.textPrimary }]}>
          Starred <Text style={{ color: C.purple }}>·</Text>
        </Text>
      </View>

      {/* Stats pill */}
      {starred.length > 0 && (
        <View style={styles.statRow}>
          <View style={[styles.statPill, {
            backgroundColor: C.purplePale,
            borderColor: C.purple + '40',
          }]}>
            <Text style={[styles.statText, { color: C.purple }]}>
              ⭐ {starred.length} saved conversation{starred.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
      )}

      {/* List */}
      <View style={styles.list}>
        <FlashList
          data={starred}
          renderItem={renderItem}
          estimatedItemSize={110}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100, paddingTop: 4 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={[styles.emptyIconWrap, {
                backgroundColor: C.purplePale,
                borderColor: C.border,
              }]}>
                <Text style={styles.emptyIcon}>⭐</Text>
              </View>
              <Text style={[styles.emptyTitle, { color: C.textPrimary }]}>
                No starred conversations
              </Text>
              <Text style={[styles.emptyText, { color: C.textMuted }]}>
                Tap ⭐ on any conversation{'\n'}to save it here.
              </Text>
            </View>
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  eyebrow: {
    ...Typography.label,
    marginBottom: 2,
  },
  title: { ...Typography.displayM },
  statRow: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  statPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1.5,
  },
  statText: {
    fontSize: 12,
    fontFamily: 'Sora_600SemiBold',
  },
  list: { flex: 1, paddingHorizontal: Spacing.xl },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIconWrap: {
    width: 72, height: 72,
    borderRadius: 24,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyIcon: { fontSize: 32 },
  emptyTitle: {
    fontFamily: 'Sora_700Bold',
    fontSize: 16,
    marginBottom: 8,
  },
  emptyText: {
    ...Typography.bodyM,
    textAlign: 'center',
    lineHeight: 22,
  },
});
