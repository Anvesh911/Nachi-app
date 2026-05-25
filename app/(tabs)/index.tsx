// app/(tabs)/index.tsx

import { useEffect, useCallback, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, RefreshControl, Alert,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, Typography, Spacing, Radius } from '../../src/theme';
import { useStore } from '../../src/store/useStore';
import {
  ConvCard, Avatar, LiveDot, SectionLabel,
  DateFilterBar, DateFilter, applyDateFilter, SearchIcon,
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

      {/* Header — from HTML: padding: 10px 22px 12px */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: C.textMuted }]}>GOOD DAY</Text>
          <Text style={[styles.appName, { color: C.textPrimary }]}>
            Nachi <Text style={{ color: C.purple }}>·</Text>
          </Text>
        </View>
        <LiveDot />
      </View>

      {/* Search — from HTML: margin:0 16px, border-radius:16px, padding:10px 14px */}
      <View style={[styles.searchContainer, {
        backgroundColor: C.surface,
        borderColor: C.border,
        shadowColor: C.purple,
      }]}>
        <SearchIcon />
        <TextInput
          style={[styles.searchInput, { color: C.textSecondary }]}
          placeholder='Search "trip", "birthday", "movie"...'
          placeholderTextColor={C.textDim}
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

      {/* Tag filter — from HTML: padding:0 16px 11px, gap:7px */}
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
              filterTag === tag && { borderColor: C.purple, backgroundColor: C.purplePale },
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

      {/* Date filter */}
      <DateFilterBar active={dateFilter} onChange={setDateFilter} />

      {/* Starred row — from HTML: width:134px, border-radius:18px, padding:14px */}
      {!searchQuery && starred.length > 0 && (
        <View style={styles.starredSection}>
          <SectionLabel label="⭐  Starred" count={starred.length} />
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
                  shadowColor: C.purple,
                }]}
                onPress={() => onPressConv(c.id)}
                activeOpacity={0.75}
              >
                <Avatar initials={c.avatar} color={c.avatarColor} size={38} />
                <Text style={[styles.starredName, { color: C.textPrimary }]} numberOfLines={1}>
                  {c.contact}
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={[styles.starredTag, { color: c.tagColor }]}>{c.tag}</Text>
                  <TouchableOpacity onPress={() => toggleStar(c.id)} hitSlop={8}>
                    <Text style={{ fontSize: 14 }}>⭐</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Recent conversations */}
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
  // header: padding 10px 22px 12px
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 22, paddingTop: 10, paddingBottom: 12,
  },
  // greeting: font-size:11px, font-weight:700, letter-spacing:2px
  greeting: { fontSize: 11, fontFamily: 'Sora_700Bold', letterSpacing: 2, marginBottom: 3 },
  // app-name: font-size:26px, font-weight:900
  appName: { fontSize: 26, fontFamily: 'Sora_800ExtraBold' },
  // search: margin:0 16px, border-radius:16px, padding:10px 14px, border:1.5px
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 16, borderWidth: 1.5,
    marginHorizontal: 16, marginBottom: 12,
    paddingHorizontal: 14, paddingVertical: 10, gap: 8,
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  searchInput: { flex: 1, fontFamily: 'Sora_400Regular', fontSize: 13 },
  clearBtn: { fontSize: 15 },
  // tags: padding:0 16px 11px, gap:7px
  tagsScroll: { maxHeight: 44 },
  tagsContent: { paddingHorizontal: 16, gap: 7, paddingBottom: 11 },
  // tag: padding:6px 14px, border-radius:99px, border:1.5px, font-size:12px
  tag: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: Radius.full, borderWidth: 1.5 },
  tagText: { fontSize: 12, fontFamily: 'Sora_600SemiBold' },
  // starred: padding:0 16px 14px, card width:134px, border-radius:18px, padding:14px
  starredSection: { paddingHorizontal: 16, marginTop: 4, marginBottom: 4 },
  starredCard: {
    width: 134, borderWidth: 1.5,
    borderRadius: 18, padding: 14, gap: 8,
    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
  },
  // sname: font-size:13px, font-weight:800
  starredName: { fontSize: 13, fontFamily: 'Sora_700Bold' },
  starredTag: { fontSize: 11, fontFamily: 'Sora_600SemiBold' },
  listContainer: { flex: 1, paddingHorizontal: 16, marginTop: 4 },
  hint: { fontSize: 10, fontFamily: 'Sora_400Regular', marginBottom: Spacing.sm, marginTop: -4 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { ...Typography.bodyM, textAlign: 'center', lineHeight: 22 },
});
