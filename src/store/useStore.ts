// src/store/useStore.ts
// Converted from Flutter Riverpod StateNotifierProviders → Zustand

import { create } from 'zustand';
import { Conversation, DEMO_CONVERSATIONS } from '../services/types';
import {
  getAllConversations,
  insertConversation,
  updateStarred,
  deleteConversation,
  searchConversations,
} from '../services/database';

interface StoreState {
  conversations: Conversation[];
  isLoading: boolean;
  searchQuery: string;
  filterTag: string;

  // Actions
  loadConversations: () => Promise<void>;
  addConversation: (conv: Conversation) => Promise<void>;
  toggleStar: (id: string) => Promise<void>;
  removeConversation: (id: string) => Promise<void>;
  setSearchQuery: (q: string) => void;
  setFilterTag: (tag: string) => void;
  getFiltered: () => Conversation[];
  seedDemoData: () => Promise<void>;
}

export const useStore = create<StoreState>((set, get) => ({
  conversations: [],
  isLoading: false,
  searchQuery: '',
  filterTag: 'All',

  loadConversations: async () => {
    set({ isLoading: true });
    try {
      const rows = await getAllConversations();
      // If DB is empty on first launch, seed demo data
      if (rows.length === 0) {
        await get().seedDemoData();
      } else {
        set({ conversations: rows, isLoading: false });
      }
    } catch (e) {
      console.error('loadConversations error:', e);
      set({ conversations: DEMO_CONVERSATIONS, isLoading: false });
    }
  },

  seedDemoData: async () => {
    for (const conv of DEMO_CONVERSATIONS) {
      await insertConversation(conv);
    }
    set({ conversations: DEMO_CONVERSATIONS, isLoading: false });
  },

  addConversation: async (conv) => {
    await insertConversation(conv);
    set((s) => ({ conversations: [conv, ...s.conversations] }));
  },

  toggleStar: async (id) => {
    const conv = get().conversations.find((c) => c.id === id);
    if (!conv) return;
    const newVal = !conv.starred;
    await updateStarred(id, newVal);
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === id ? { ...c, starred: newVal } : c
      ),
    }));
  },

  removeConversation: async (id) => {
    await deleteConversation(id);
    set((s) => ({
      conversations: s.conversations.filter((c) => c.id !== id),
    }));
  },

  setSearchQuery: (q) => set({ searchQuery: q }),
  setFilterTag: (tag) => set({ filterTag: tag }),

  getFiltered: () => {
    const { conversations, searchQuery, filterTag } = get();
    return conversations.filter((c) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        c.contact.toLowerCase().includes(q) ||
        c.transcript.toLowerCase().includes(q) ||
        c.topics.some((t) => t.includes(q));
      const matchTag = filterTag === 'All' || c.tag === filterTag;
      return matchSearch && matchTag;
    });
  },
}));
