// app/(tabs)/starred.tsx

import { useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, RefreshControl,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, Spacing } from '../../src/theme';
import { useStore } from '../../src/store/useStore';
import { ConvCard, SectionLabel } from '../../src/components';
import { Conversation } from '../../src/services/types';

export default function StarredScreen() {
  const insets = useSafeAreaInsets();
  const C = useColors();
  const {
    loadConversations, isLoading,
    conversations, toggleStar,
  } = useStore();

  useEffect(() => {
    loadConversations();
  }, []);

  const starred = conversations.filter((c) => c.starred);

  const onPressConv = useCallback((id: string) => {
    router.push(`/detail/${id}`);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Conversation }) => (
      <ConvCard
        conversation={item}
        onPress={() => onPressConv(item.id)}
        onStar={() => toggleStar(item.id)}
      />
    ),
    [toggleStar]
  );

  return (
    <View style={[styles.root, { backgroundColor: C.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: C.textMuted }]}>FAVORITES</Text>
          <Text style={[styles.appName, { color: C.textPrimary }]}>
            Starred <Text style={{ color: C.purple }}>·</Text>
          </Text>
        </View>
      </View>

      <View style={styles.listContainer}>
        <SectionLabel label="⭐ Your Starred Conversations" count={starred.length} />
        {starred.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>⭐</Text>
            <Text style={[styles.emptyText, { color: C.textMuted }]}>
              No starred conversations yet.{'\n'}Star conversations to save them here.
            </Text>
          </View>
        ) : (
          <FlashList
            data={starred}
            renderItem={renderItem}
            estimatedItemSize={120}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={loadConversations}
                tintColor={C.purple}
              />
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 12,
  },
  greeting: {
    fontSize: 11,
    fontFamily: 'Nunito_700Bold',
    letterSpacing: 2,
    marginBottom: 3,
  },
  appName: {
    fontSize: 26,
    fontFamily: 'Nunito_900Black',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: Spacing.md,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 44,
    marginBottom: 16,
  },
  emptyText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 22,
  },
});
