// app/(tabs)/index.tsx

import { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, Typography, Spacing, Radius, Shadow } from '../../src/theme';
import { useStore } from '../../src/store/useStore';
import {
  ConvCard, Avatar, LiveDot, SectionLabel,
  DateFilterBar, DateFilter, applyDateFilter,
} from '../../src/components';
import { Conversation } from '../../src/services/types';

const ALL_TAGS = ['All', 'Work', 'Family', 'Friend', 'Health', 'General'];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const C      = useColors();
  const {
    loadConversations, isLoading,
    searchQuery, setSearchQuery,
    filterTag, setFilterTag,
    getFiltered, toggleStar,
    removeConversation, hideConversation,
    conversations,
  } = useStore();

  const [dateFilter, setDateFilter] = useState<DateFilter>('all');

  useEffect(() => { loadConversations(); }, []);

  const filtered = applyDateFilter(getFiltered(), dateFilter);
  const starred  = conversations.filter((c) => c.starred);

  const onPressConv = useCallback((id: string) => {
    router.push(`/detail/${id}`);
  }, []);

  function onLongPressConv(item: Conversation) {
    Alert.alert(item.contact, 'What do you want to do?', [
      { text: 'Hide Conversation', onPress: () => hideConversation(item.id) },
      {
        text: 'Delete', style: 'destructive',
        onPress: () =>
          Alert.alert('Delete', 'Delete this conversation permanently?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => removeConversation(item.id) },
          ]),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  const renderItem = useCallback(
    ({ item }: { item: Conversation }) => (
      <ConvCard
        conversation={item}
        searchQuery={searchQuery}
        onPress={() => onPressConv(item.id)}
        onStar={() => toggleStar(item.id)}
        onLongPress={() => onLongPressConv(item)}
      />
    ),
    [searchQuery, toggleStar]
  );

  return (
    <View style={[styles.root, { backgroundColor: C.background, paddingTop: insets.top }]}>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: C.textMuted }]}>GOOD DAY</Text>
          <Text style={[styles.appName, { color: C.textPrimary }]}>
            Nachi <Text style={{ color: C.purple }}>·</Text>
          </Text>
        </View>
        <LiveDot />
      </View>

      {/* Search bar */}
      <View style={[styles.searchContainer, {
        backgroundColor: C.surface,
        borderColor: C.border,
        ...Shadow.card,
        shadowColor: C.purple,
      }]}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={[styles.searchInput, { color: C.textSecondary }]}
          placeholder='Search "trip", "birthday", "movie"...'
          placeholderTextColor={C.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
            <Text style={[styles.clearBtn, { color: C.textMuted }]}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tag filter */}
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
            style={[
              styles.tag,
              { borderColor: C.border, backgroundColor: C.surface },
              filterTag === tag && {
                borderColor: C.purple,
                backgroundColor: C.purplePale,
              },
            ]}
          >
            <Text style={[
              styles.tagText,
              { color: filterTag === tag ? C.purple : C.textMuted },
            ]}>
              {tag}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Date filter — FIX: compact horizontal chips */}
      <DateFilterBar active={dateFilter} onChange={setDateFilter} />

      {/* Starred row */}
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
                style={[styles.starredCard, {
                  backgroundColor: C.surface,
                  borderColor: C.border,
                  ...Shadow.card,
                  shadowColor: C.purple,
                }]}
                onPress={() => onPressConv(c.id)}
                activeOpacity={0.75}
              >
                <Avatar initials={c.avatar} color={c.avatarColor} size={36} />
                <Text style={[styles.starredName, { color: C.textPrimary }]} numberOfLines={1}>
                  {c.contact}
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={[styles.starredTag, { color: c.tagColor }]}>{c.tag}</Text>
                  <TouchableOpacity onPress={() => toggleStar(c.id)} hitSlop={8}>
                    <Text style={{ fontSize: 14, opacity: c.starred ? 1 : 0.3 }}>⭐</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Conversations list */}
      <View style={styles.listContainer}>
        <SectionLabel
          label={searchQuery ? `Results for "${searchQuery}"` : 'Recent Conversations'}
          count={filtered.length}
        />
        <Text style={[styles.hint, { color: C.textMuted }]}>Long-press to hide or delete</Text>
        <FlashList
          data={filtered}
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
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🎙️</Text>
              <Text style={[styles.emptyText, { color: C.textMuted }]}>
                {searchQuery
                  ? `No conversations found for "${searchQuery}"`
                  : dateFilter !== 'all'
                  ? 'No conversations in this time period.'
                  : 'No conversations yet.\nTap the mic button to record.'}
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
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-end', paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md, paddingBottom: Spacing.lg,
  },
  greeting: { ...Typography.label, marginBottom: 2 },
  appName: { ...Typography.displayM },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: Radius.lg, borderWidth: 1.5,
    marginHorizontal: Spacing.xl, marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md, paddingVertical: 10, gap: 10,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontFamily: 'Sora_400Regular', fontSize: 13 },
  clearBtn: { fontSize: 16 },
  tagsScroll: { maxHeight: 44 },
  tagsContent: { paddingHorizontal: Spacing.xl, gap: 8, paddingBottom: 8 },
  tag: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: Radius.full, borderWidth: 1.5,
  },
  tagText: { fontSize: 12, fontFamily: 'Sora_600SemiBold' },
  starredSection: {
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  starredCard: {
    width: 140, borderWidth: 1.5,
    borderRadius: Radius.lg, padding: 14, gap: 8,
  },
  starredName: { ...Typography.headingS },
  starredTag: { fontSize: 11, fontFamily: 'Sora_600SemiBold' },
  listContainer: { flex: 1, paddingHorizontal: Spacing.xl, marginTop: Spacing.lg },
  hint: { fontSize: 10, fontFamily: 'Sora_400Regular', marginBottom: Spacing.sm, marginTop: -8 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { ...Typography.bodyM, textAlign: 'center', lineHeight: 22 },
});
