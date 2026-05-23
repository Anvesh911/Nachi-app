// src/services/database.ts

import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Conversation, Reminder, ConversationSummary, Task, DatePlan } from './types';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('anvy.db');
  await initSchema(db);
  return db;
}

async function initSchema(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      contact TEXT NOT NULL,
      avatar TEXT NOT NULL,
      avatar_color TEXT NOT NULL,
      date TEXT NOT NULL,
      duration_seconds INTEGER NOT NULL,
      duration_label TEXT NOT NULL,
      tag TEXT DEFAULT 'General',
      tag_color TEXT DEFAULT '#636e72',
      starred INTEGER DEFAULT 0,
      hidden INTEGER DEFAULT 0,
      audio_file_path TEXT,
      transcript TEXT DEFAULT '',
      summary_json TEXT DEFAULT '{}',
      topics TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS reminders (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      title TEXT NOT NULL,
      notes TEXT DEFAULT '',
      scheduled_date TEXT NOT NULL,
      repeat TEXT DEFAULT 'none',
      completed INTEGER DEFAULT 0,
      notification_id TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_conversations_date ON conversations(date DESC);
    CREATE INDEX IF NOT EXISTS idx_conversations_starred ON conversations(starred);
    CREATE INDEX IF NOT EXISTS idx_conversations_hidden ON conversations(hidden);
    CREATE INDEX IF NOT EXISTS idx_reminders_conv ON reminders(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_reminders_date ON reminders(scheduled_date);
  `);

  // Migrations for existing installs
  const migrations = [
    `ALTER TABLE conversations ADD COLUMN hidden INTEGER DEFAULT 0`,
    `ALTER TABLE reminders ADD COLUMN title TEXT NOT NULL DEFAULT ''`,
    `ALTER TABLE reminders ADD COLUMN notes TEXT DEFAULT ''`,
    `ALTER TABLE reminders ADD COLUMN scheduled_date TEXT NOT NULL DEFAULT ''`,
    `ALTER TABLE reminders ADD COLUMN repeat TEXT DEFAULT 'none'`,
    `ALTER TABLE reminders ADD COLUMN notification_id TEXT`,
  ];
  for (const m of migrations) {
    try { await database.execAsync(m); } catch (_) {}
  }
}

// ─── Conversations ────────────────────────────────────────────────────────────

export async function insertConversation(conv: Conversation): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT OR REPLACE INTO conversations
      (id, contact, avatar, avatar_color, date, duration_seconds, duration_label,
       tag, tag_color, starred, hidden, audio_file_path, transcript, summary_json, topics)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      conv.id, conv.contact, conv.avatar, conv.avatarColor,
      conv.date, conv.durationSeconds, conv.durationLabel,
      conv.tag, conv.tagColor,
      conv.starred ? 1 : 0,
      conv.hidden ? 1 : 0,
      conv.audioFilePath ?? null,
      conv.transcript,
      JSON.stringify(conv.summary),
      JSON.stringify(conv.topics),
    ]
  );
}

export async function getAllConversations(): Promise<Conversation[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<any>(
    `SELECT * FROM conversations WHERE hidden = 0 ORDER BY date DESC`
  );
  return rows.map(rowToConversation);
}

export async function getHiddenConversations(): Promise<Conversation[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<any>(
    `SELECT * FROM conversations WHERE hidden = 1 ORDER BY date DESC`
  );
  return rows.map(rowToConversation);
}

export async function searchConversations(query: string): Promise<Conversation[]> {
  const database = await getDatabase();
  const q = `%${query}%`;
  const rows = await database.getAllAsync<any>(
    `SELECT * FROM conversations
     WHERE hidden = 0 AND (contact LIKE ? OR transcript LIKE ? OR topics LIKE ?)
     ORDER BY date DESC`,
    [q, q, q]
  );
  return rows.map(rowToConversation);
}

export async function updateStarred(id: string, starred: boolean): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(`UPDATE conversations SET starred = ? WHERE id = ?`, [starred ? 1 : 0, id]);
}

export async function updateHidden(id: string, hidden: boolean): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(`UPDATE conversations SET hidden = ? WHERE id = ?`, [hidden ? 1 : 0, id]);
}

export async function updateSummary(id: string, summary: ConversationSummary): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `UPDATE conversations SET summary_json = ? WHERE id = ?`,
    [JSON.stringify(summary), id]
  );
}

export async function updateTranscriptAndSummary(
  id: string, transcript: string, summaryJson: string
): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `UPDATE conversations SET transcript = ?, summary_json = ? WHERE id = ?`,
    [transcript, summaryJson, id]
  );
}

export async function deleteConversation(id: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(`DELETE FROM conversations WHERE id = ?`, [id]);
  // Clean up AsyncStorage reminder data for this conversation
  try { await AsyncStorage.removeItem(`anvy_reminders_${id}`); } catch (_) {}
}

function rowToConversation(row: any): Conversation {
  const rawSummary = (() => {
    try { return JSON.parse(row.summary_json ?? '{}'); } catch { return {}; }
  })();

  // Ensure new fields exist for old data
  const summary: ConversationSummary = {
    keyPoints:       rawSummary.keyPoints       ?? [],
    promises:        rawSummary.promises        ?? [],
    tasks:           rawSummary.tasks           ?? [],
    dates:           rawSummary.dates           ?? [],
    datePlans:       rawSummary.datePlans       ?? [],
    reminders:       rawSummary.reminders       ?? [],
    tone:            rawSummary.tone            ?? 'Neutral',
    toneEmoji:       rawSummary.toneEmoji       ?? '😐',
    toneDescription: rawSummary.toneDescription ?? '',
    tags:            rawSummary.tags            ?? [],
  };

  return {
    id: row.id,
    contact: row.contact,
    avatar: row.avatar,
    avatarColor: row.avatar_color,
    date: row.date,
    durationSeconds: row.duration_seconds,
    durationLabel: row.duration_label,
    tag: row.tag,
    tagColor: row.tag_color,
    starred: row.starred === 1,
    hidden: row.hidden === 1,
    audioFilePath: row.audio_file_path ?? undefined,
    transcript: row.transcript ?? '',
    summary,
    topics: (() => { try { return JSON.parse(row.topics ?? '[]'); } catch { return []; } })(),
  };
}

// ─── Reminders (SQLite) ───────────────────────────────────────────────────────

export async function insertReminder(reminder: Reminder): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT OR REPLACE INTO reminders
      (id, conversation_id, title, notes, scheduled_date, repeat, completed, notification_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      reminder.id,
      reminder.conversationId,
      reminder.title,
      reminder.notes ?? '',
      reminder.scheduledDate,
      reminder.repeat,
      reminder.completed ? 1 : 0,
      reminder.notificationId ?? null,
      reminder.createdAt,
    ]
  );
}

export async function getRemindersForConversation(conversationId: string): Promise<Reminder[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<any>(
    `SELECT * FROM reminders WHERE conversation_id = ? ORDER BY scheduled_date ASC`,
    [conversationId]
  );
  return rows.map(rowToReminder);
}

export async function getAllReminders(): Promise<Reminder[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<any>(
    `SELECT * FROM reminders ORDER BY scheduled_date ASC`
  );
  return rows.map(rowToReminder);
}

export async function updateReminderCompleted(id: string, completed: boolean): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `UPDATE reminders SET completed = ? WHERE id = ?`,
    [completed ? 1 : 0, id]
  );
}

export async function updateReminder(reminder: Reminder): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `UPDATE reminders SET title = ?, notes = ?, scheduled_date = ?, repeat = ?, notification_id = ? WHERE id = ?`,
    [reminder.title, reminder.notes ?? '', reminder.scheduledDate, reminder.repeat, reminder.notificationId ?? null, reminder.id]
  );
}

export async function deleteReminder(id: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(`DELETE FROM reminders WHERE id = ?`, [id]);
}

function rowToReminder(row: any): Reminder {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    title: row.title,
    notes: row.notes ?? '',
    scheduledDate: row.scheduled_date,
    repeat: row.repeat ?? 'none',
    completed: row.completed === 1,
    notificationId: row.notification_id ?? undefined,
    createdAt: row.created_at,
  };
}

// ─── Storage Info ─────────────────────────────────────────────────────────────

export async function getStorageInfo(): Promise<{
  conversationsCount: number;
  remindersCount: number;
  transcriptChars: number;
}> {
  const database = await getDatabase();
  const convCount = await database.getFirstAsync<{ count: number }>(`SELECT COUNT(*) as count FROM conversations`);
  const remCount  = await database.getFirstAsync<{ count: number }>(`SELECT COUNT(*) as count FROM reminders`);
  const transcripts = await database.getAllAsync<{ transcript: string }>(`SELECT transcript FROM conversations`);
  const totalChars = transcripts.reduce((sum, r) => sum + (r.transcript?.length ?? 0), 0);

  return {
    conversationsCount: convCount?.count ?? 0,
    remindersCount: remCount?.count ?? 0,
    transcriptChars: totalChars,
  };
}

export async function clearAllTranscripts(): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(`UPDATE conversations SET transcript = ''`);
}

export async function deleteOldConversations(beforeDate: string): Promise<number> {
  const database = await getDatabase();
  const result = await database.runAsync(
    `DELETE FROM conversations WHERE date < ? AND starred = 0`,
    [beforeDate]
  );
  return result.changes;
}
