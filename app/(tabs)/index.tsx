// app/(tabs)/index.tsx
// Home screen - converted from Flutter HomeScreen StatefulWidget
// Uses FlashList instead of Flutter ListView.builder for performance

import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '../../src/theme';
import { useStore } from '../../src/store/useStore';
import { ConvCard, Avatar, LiveDot, SectionLabel } from '../../src/components';
import { Conversation } from '../../src/services/types';

const ALL_TAGS = ['All', 'Work', 'Family', 'Friend', 'Health', 'General'];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const {
    loadConversations,
    isLoading,
    searchQuery,
    setSearchQuery,
    filterTag,
    setFilterTag,
    getFiltered,
    toggleStar,
    conversations,
  } = useStore();

  useEffect(() => {
    loadConversations();
  }, []);

  const filtered = getFiltered();
  const starred = conversations.filter((c) => c.starred);

  const onPressConv = useCallback((id: string) => {
    router.push(`/detail/${id}`);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Conversation }) => (
      <ConvCard
        conversation={item}
        searchQuery={searchQuery}
        onPress={() => onPressConv(item.id)}
        onStar={() => toggleStar(item.id)}
      />
    ),
    [searchQuery, toggleStar]
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>GOOD DAY</Text>
          <Text style={styles.appName}>
            Nachi <Text style={{ color: Colors.neonBlue }}>·</Text>
          </Text>
        </View>
        <LiveDot />
      </View>

      {/* Search bar - converted from Flutter TextField in Container */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder='Search "trip", "birthday", "movie"...'
          placeholderTextColor={Colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter tags - converted from Flutter horizontal ListView */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tagsScroll}
        contentContainerStyle={styles.tagsContent}
      >
        {ALL_TAGS.map((tag) => (
          <TouchableOpacity
            key={tag}
            onPress={() => setFilterTag(tag)}
            style={[styles.tag, filterTag === tag && styles.tagActive]}
          >
            <Text style={[styles.tagText, filterTag === tag && styles.tagTextActive]}>
              {tag}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Starred horizontal row (when no search active) */}
      {!searchQuery && starred.length > 0 && (
        <View style={styles.starredSection}>
          <SectionLabel label="⭐ Starred" count={starred.length} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10, paddingBottom: 4 }}
          >
            {starred.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={styles.starredCard}
                onPress={() => onPressConv(c.id)}
                activeOpacity={0.75}
              >
                <Avatar initials={c.avatar} color={c.avatarColor} size={36} />
                <Text style={styles.starredName} numberOfLines={1}>{c.contact}</Text>
                <Text style={[styles.starredTag, { color: c.tagColor }]}>{c.tag}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Conversations list - FlashList replaces Flutter ListView.builder */}
      <View style={styles.listContainer}>
        <SectionLabel
          label={searchQuery ? `Results for "${searchQuery}"` : 'Recent Conversations'}
          count={filtered.length}
        />
        <FlashList
          data={filtered}
          renderItem={renderItem}
          estimatedItemSize={110}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={loadConversations}
              tintColor={Colors.neonBlue}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyText}>
                {searchQuery
                  ? `No conversations found for "${searchQuery}"`
                  : 'No conversations yet. Tap 🎙️ to record.'}
              </Text>
            </View>
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  greeting: {
    ...Typography.label,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  appName: {
    ...Typography.displayM,
    color: Colors.textPrimary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    gap: 10,
  },
  searchIcon: { fontSize: 16 },
  searchInput: {
    flex: 1,
    color: Colors.textSecondary,
    fontFamily: 'Sora_400Regular',
    fontSize: 13,
  },
  clearBtn: {
    color: Colors.textMuted,
    fontSize: 16,
  },
  tagsScroll: { maxHeight: 44 },
  tagsContent: {
    paddingHorizontal: Spacing.xl,
    gap: 8,
    paddingBottom: 8,
  },
  tag: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tagActive: {
    borderColor: Colors.neonBlue,
    backgroundColor: Colors.neonBlue + '18',
  },
  tagText: {
    fontSize: 12,
    fontFamily: 'Sora_600SemiBold',
    color: Colors.textMuted,
  },
  tagTextActive: { color: Colors.neonBlue },
  starredSection: {
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  starredCard: {
    width: 140,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: 14,
    gap: 8,
  },
  starredName: {
    ...Typography.headingS,
    color: Colors.textPrimary,
  },
  starredTag: {
    fontSize: 11,
    fontFamily: 'Sora_400Regular',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: {
    ...Typography.bodyM,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
