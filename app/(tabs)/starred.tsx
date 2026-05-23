// app/(tabs)/starred.tsx

import { useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, Typography, Spacing } from '../../src/theme';
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
      <View style={styles.header}>
        <Text style={[styles.title, { color: C.textPrimary }]}>Starred</Text>
      </View>
      <View style={styles.list}>
        <SectionLabel label="⭐ Saved Conversations" count={starred.length} />
        <FlashList
          data={starred}
          renderItem={renderItem}
          estimatedItemSize={110}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>⭐</Text>
              <Text style={[styles.emptyText, { color: C.textMuted }]}>
                No starred conversations yet.{'\n'}Tap ⭐ on any conversation to save it.
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
  header: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg },
  title: { ...Typography.displayM },
  list: { flex: 1, paddingHorizontal: Spacing.xl },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { ...Typography.bodyM, textAlign: 'center', lineHeight: 22 },
});
