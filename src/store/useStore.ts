// src/store/useStore.ts

import { create } from 'zustand';
import { Conversation, ConversationSummary, Reminder, DEMO_CONVERSATIONS } from '../services/types';
import {
  getAllConversations,
  getHiddenConversations,
  insertConversation,
  updateStarred,
  updateHidden,
  updateSummary,
  deleteConversation,
  insertReminder,
  getRemindersForConversation,
  updateReminderCompleted,
  updateReminder,
  deleteReminder,
} from '../services/database';
import * as Notifications from 'expo-notifications';

// ─── Helper ───────────────────────────────────────────────────────────────────
const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

// ─── Store Interface ──────────────────────────────────────────────────────────
interface StoreState {
  conversations: Conversation[];
  hiddenConversations: Conversation[];
  reminders: Reminder[];
  isLoading: boolean;
  searchQuery: string;
  filterTag: string;

  // Conversations
  loadConversations: () => Promise<void>;
  loadHiddenConversations: () => Promise<void>;
  addConversation: (conv: Conversation) => Promise<void>;
  toggleStar: (id: string) => Promise<void>;
  removeConversation: (id: string) => Promise<void>;
  hideConversation: (id: string) => Promise<void>;
  unhideConversation: (id: string) => Promise<void>;
  setSearchQuery: (q: string) => void;
  setFilterTag: (tag: string) => void;
  getFiltered: () => Conversation[];
  seedDemoData: () => Promise<void>;

  // Editable Summary
  updateConversationSummary: (id: string, summary: ConversationSummary) => Promise<void>;
  updateKeyPoint: (convId: string, index: number, text: string) => Promise<void>;
  addKeyPoint: (convId: string, text: string) => Promise<void>;
  deleteKeyPoint: (convId: string, index: number) => Promise<void>;
  toggleTask: (convId: string, taskId: string) => Promise<void>;
  addTask: (convId: string, text: string) => Promise<void>;
  deleteTask: (convId: string, taskId: string) => Promise<void>;
  updateTask: (convId: string, taskId: string, text: string) => Promise<void>;
  addDatePlan: (convId: string, plan: { title: string; date: string; time?: string; location?: string }) => Promise<void>;
  deleteDatePlan: (convId: string, planId: string) => Promise<void>;
  updateTone: (convId: string, emoji: string, tone: string, description?: string) => Promise<void>;
  addTag: (convId: string, tag: string) => Promise<void>;
  removeTag: (convId: string, tag: string) => Promise<void>;

  // Reminders
  loadReminders: (convId: string) => Promise<void>;
  addReminder: (convId: string, title: string, notes: string, date: Date, repeat: Reminder['repeat']) => Promise<void>;
  toggleReminderCompleted: (id: string) => Promise<void>;
  editReminder: (reminder: Reminder) => Promise<void>;
  removeReminder: (id: string) => Promise<void>;
}

// ─── Store ────────────────────────────────────────────────────────────────────
export const useStore = create<StoreState>((set, get) => ({
  conversations: [],
  hiddenConversations: [],
  reminders: [],
  isLoading: false,
  searchQuery: '',
  filterTag: 'All',

  // ── Conversations ───────────────────────────────────────────────────────────

  loadConversations: async () => {
    set({ isLoading: true });
    try {
      const rows = await getAllConversations();
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

  loadHiddenConversations: async () => {
    try {
      const rows = await getHiddenConversations();
      set({ hiddenConversations: rows });
    } catch (e) {
      console.error('loadHiddenConversations error:', e);
    }
  },

  seedDemoData: async () => {
    try {
      for (const conv of DEMO_CONVERSATIONS) {
        await insertConversation(conv);
      }
      set({ conversations: DEMO_CONVERSATIONS, isLoading: false });
    } catch (e) {
      console.error('seedDemoData error:', e);
      set({ conversations: [], isLoading: false });
    }
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
    try {
      // Cancel all notifications for reminders of this conversation
      const reminders = await getRemindersForConversation(id);
      for (const r of reminders) {
        if (r.notificationId) {
          try { await Notifications.cancelScheduledNotificationAsync(r.notificationId); } catch (_) {}
        }
      }
      await deleteConversation(id);
      set((s) => ({
        conversations: s.conversations.filter((c) => c.id !== id),
        hiddenConversations: s.hiddenConversations.filter((c) => c.id !== id),
      }));
    } catch (e) {
      console.error('removeConversation error:', e);
    }
  },

  hideConversation: async (id) => {
    try {
      await updateHidden(id, true);
      const conv = get().conversations.find((c) => c.id === id);
      if (conv) {
        set((s) => ({
          conversations: s.conversations.filter((c) => c.id !== id),
          hiddenConversations: [{ ...conv, hidden: true }, ...s.hiddenConversations],
        }));
      }
    } catch (e) {
      console.error('hideConversation error:', e);
    }
  },

  unhideConversation: async (id) => {
    try {
      await updateHidden(id, false);
      const conv = get().hiddenConversations.find((c) => c.id === id);
      if (conv) {
        set((s) => ({
          hiddenConversations: s.hiddenConversations.filter((c) => c.id !== id),
          conversations: [{ ...conv, hidden: false }, ...s.conversations],
        }));
      }
    } catch (e) {
      console.error('unhideConversation error:', e);
    }
  },

  setSearchQuery: (q) => set({ searchQuery: q }),
  setFilterTag:  (tag) => set({ filterTag: tag }),

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

  // ── Editable Summary ────────────────────────────────────────────────────────

  updateConversationSummary: async (id, summary) => {
    await updateSummary(id, summary);
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === id ? { ...c, summary } : c
      ),
    }));
  },

  // Key Points
  addKeyPoint: async (convId, text) => {
    const conv = get().conversations.find((c) => c.id === convId);
    if (!conv) return;
    const summary = { ...conv.summary, keyPoints: [...conv.summary.keyPoints, text] };
    await get().updateConversationSummary(convId, summary);
  },

  updateKeyPoint: async (convId, index, text) => {
    const conv = get().conversations.find((c) => c.id === convId);
    if (!conv) return;
    const keyPoints = [...conv.summary.keyPoints];
    keyPoints[index] = text;
    await get().updateConversationSummary(convId, { ...conv.summary, keyPoints });
  },

  deleteKeyPoint: async (convId, index) => {
    const conv = get().conversations.find((c) => c.id === convId);
    if (!conv) return;
    const keyPoints = conv.summary.keyPoints.filter((_, i) => i !== index);
    await get().updateConversationSummary(convId, { ...conv.summary, keyPoints });
  },

  // Tasks
  toggleTask: async (convId, taskId) => {
    const conv = get().conversations.find((c) => c.id === convId);
    if (!conv) return;
    const tasks = conv.summary.tasks.map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    await get().updateConversationSummary(convId, { ...conv.summary, tasks });
  },

  addTask: async (convId, text) => {
    const conv = get().conversations.find((c) => c.id === convId);
    if (!conv) return;
    const tasks = [...(conv.summary.tasks ?? []), { id: makeId(), text, completed: false }];
    await get().updateConversationSummary(convId, { ...conv.summary, tasks });
  },

  deleteTask: async (convId, taskId) => {
    const conv = get().conversations.find((c) => c.id === convId);
    if (!conv) return;
    const tasks = conv.summary.tasks.filter((t) => t.id !== taskId);
    await get().updateConversationSummary(convId, { ...conv.summary, tasks });
  },

  updateTask: async (convId, taskId, text) => {
    const conv = get().conversations.find((c) => c.id === convId);
    if (!conv) return;
    const tasks = conv.summary.tasks.map((t) =>
      t.id === taskId ? { ...t, text } : t
    );
    await get().updateConversationSummary(convId, { ...conv.summary, tasks });
  },

  // Date Plans
  addDatePlan: async (convId, plan) => {
    const conv = get().conversations.find((c) => c.id === convId);
    if (!conv) return;
    const datePlans = [...(conv.summary.datePlans ?? []), { id: makeId(), ...plan }];
    await get().updateConversationSummary(convId, { ...conv.summary, datePlans });
  },

  deleteDatePlan: async (convId, planId) => {
    const conv = get().conversations.find((c) => c.id === convId);
    if (!conv) return;
    const datePlans = conv.summary.datePlans.filter((p) => p.id !== planId);
    await get().updateConversationSummary(convId, { ...conv.summary, datePlans });
  },

  // Tone
  updateTone: async (convId, emoji, tone, description) => {
    const conv = get().conversations.find((c) => c.id === convId);
    if (!conv) return;
    await get().updateConversationSummary(convId, {
      ...conv.summary,
      toneEmoji: emoji,
      tone,
      toneDescription: description ?? conv.summary.toneDescription,
    });
  },

  // Tags
  addTag: async (convId, tag) => {
    const conv = get().conversations.find((c) => c.id === convId);
    if (!conv) return;
    const tags = [...new Set([...(conv.summary.tags ?? []), tag])];
    await get().updateConversationSummary(convId, { ...conv.summary, tags });
  },

  removeTag: async (convId, tag) => {
    const conv = get().conversations.find((c) => c.id === convId);
    if (!conv) return;
    const tags = (conv.summary.tags ?? []).filter((t) => t !== tag);
    await get().updateConversationSummary(convId, { ...conv.summary, tags });
  },

  // ── Reminders ───────────────────────────────────────────────────────────────

  loadReminders: async (convId) => {
    try {
      const rows = await getRemindersForConversation(convId);
      set({ reminders: rows });
    } catch (e) {
      console.error('loadReminders error:', e);
    }
  },

  addReminder: async (convId, title, notes, date, repeat) => {
    try {
      // Schedule notification
      let notificationId: string | undefined;
      try {
        notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: 'AnVy Reminder',
            body: title,
            sound: true,
            data: { conversationId: convId },
          },
          trigger: { date },
        });
      } catch (e) {
        console.error('Notification schedule error:', e);
      }

      const reminder: Reminder = {
        id: makeId(),
        conversationId: convId,
        title,
        notes,
        scheduledDate: date.toISOString(),
        repeat,
        completed: false,
        notificationId,
        createdAt: new Date().toISOString(),
      };

      await insertReminder(reminder);
      set((s) => ({ reminders: [...s.reminders, reminder] }));
    } catch (e) {
      console.error('addReminder error:', e);
    }
  },

  toggleReminderCompleted: async (id) => {
    const reminder = get().reminders.find((r) => r.id === id);
    if (!reminder) return;
    const completed = !reminder.completed;
    await updateReminderCompleted(id, completed);
    set((s) => ({
      reminders: s.reminders.map((r) =>
        r.id === id ? { ...r, completed } : r
      ),
    }));
  },

  editReminder: async (reminder) => {
    try {
      // Cancel old notification and reschedule
      if (reminder.notificationId) {
        try { await Notifications.cancelScheduledNotificationAsync(reminder.notificationId); } catch (_) {}
      }
      let notificationId: string | undefined;
      try {
        notificationId = await Notifications.scheduleNotificationAsync({
          content: { title: 'AnVy Reminder', body: reminder.title, sound: true },
          trigger: { date: new Date(reminder.scheduledDate) },
        });
      } catch (_) {}

      const updated = { ...reminder, notificationId };
      await updateReminder(updated);
      set((s) => ({
        reminders: s.reminders.map((r) => r.id === reminder.id ? updated : r),
      }));
    } catch (e) {
      console.error('editReminder error:', e);
    }
  },

  removeReminder: async (id) => {
    try {
      const reminder = get().reminders.find((r) => r.id === id);
      if (reminder?.notificationId) {
        try { await Notifications.cancelScheduledNotificationAsync(reminder.notificationId); } catch (_) {}
      }
      await deleteReminder(id);
      set((s) => ({ reminders: s.reminders.filter((r) => r.id !== id) }));
    } catch (e) {
      console.error('removeReminder error:', e);
    }
  },
}));
