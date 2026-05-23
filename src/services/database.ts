// src/services/database.ts
// Converted from Flutter DatabaseHelper (sqflite) → expo-sqlite

import * as SQLite from 'expo-sqlite';
import { Conversation } from './types';

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
      reminder_text TEXT NOT NULL,
      reminder_time TEXT,
      is_done INTEGER DEFAULT 0,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_conversations_date ON conversations(date DESC);
    CREATE INDEX IF NOT EXISTS idx_conversations_starred ON conversations(starred);
    CREATE INDEX IF NOT EXISTS idx_conversations_hidden ON conversations(hidden);
  `);

  // Migration: add hidden column if user already has old DB installed
  try {
    await database.execAsync(`ALTER TABLE conversations ADD COLUMN hidden INTEGER DEFAULT 0`);
  } catch (_) { /* column already exists — safe to ignore */ }
}

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

// Only returns non-hidden conversations
export async function getAllConversations(): Promise<Conversation[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<any>(
    `SELECT * FROM conversations WHERE hidden = 0 ORDER BY date DESC`
  );
  return rows.map(rowToConversation);
}

// Only returns hidden conversations
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
  await database.runAsync(
    `UPDATE conversations SET starred = ? WHERE id = ?`,
    [starred ? 1 : 0, id]
  );
}

export async function updateHidden(id: string, hidden: boolean): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `UPDATE conversations SET hidden = ? WHERE id = ?`,
    [hidden ? 1 : 0, id]
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
}

function rowToConversation(row: any): Conversation {
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
    summary: (() => { try { return JSON.parse(row.summary_json ?? '{}'); } catch { return {}; } })(),
    topics: (() => { try { return JSON.parse(row.topics ?? '[]'); } catch { return []; } })(),
  };
}
