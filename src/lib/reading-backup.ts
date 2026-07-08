import type { Book, ReadingSession } from './reading-types';
import type { ReadingStorage } from './reading-storage';

const SCHEMA_VERSION = '2';
const SUPPORTED_VERSIONS = ['1', '2'];

type BackupData = {
  schemaVersion: string;
  exportedAt: string;
  books: Book[];
  sessions: ReadingSession[];
};

function formatFilename(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
  return `reading-log-backup-${stamp}.json`;
}

export async function exportData(storage: ReadingStorage): Promise<void> {
  const { books, sessions } = await storage.getAllData();
  const payload: BackupData = {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    books,
    sessions,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = formatFilename();
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function validateBackup(data: unknown): BackupData {
  if (!data || typeof data !== 'object') {
    throw new Error('無効なファイル形式です');
  }
  const obj = data as Record<string, unknown>;
  if (!obj.schemaVersion || typeof obj.schemaVersion !== 'string') {
    throw new Error('schemaVersion が見つかりません');
  }
  if (!SUPPORTED_VERSIONS.includes(obj.schemaVersion)) {
    throw new Error(`未対応のバージョンです: ${obj.schemaVersion}`);
  }
  if (!Array.isArray(obj.books)) {
    throw new Error('books データが見つかりません');
  }
  if (!Array.isArray(obj.sessions)) {
    throw new Error('sessions データが見つかりません');
  }
  for (const b of obj.books) {
    if (!b || typeof b !== 'object' || !('id' in b) || !('title' in b)) {
      throw new Error('不正な本のデータが含まれています');
    }
  }
  for (const s of obj.sessions) {
    if (!s || typeof s !== 'object' || !('id' in s) || !('bookId' in s)) {
      throw new Error('不正なセッションデータが含まれています');
    }
  }
  return data as BackupData;
}

export type ImportResult = {
  booksCount: number;
  sessionsCount: number;
};

export async function importReplace(
  storage: ReadingStorage,
  file: File,
): Promise<ImportResult> {
  const text = await file.text();
  const raw = JSON.parse(text);
  const backup = validateBackup(raw);
  await storage.replaceAllData(backup.books, backup.sessions);
  return { booksCount: backup.books.length, sessionsCount: backup.sessions.length };
}

export async function importMerge(
  storage: ReadingStorage,
  file: File,
): Promise<ImportResult> {
  const text = await file.text();
  const raw = JSON.parse(text);
  const backup = validateBackup(raw);
  const existing = await storage.getAllData();
  const existingBookIds = new Set(existing.books.map((b) => b.id));
  const existingSessionIds = new Set(existing.sessions.map((s) => s.id));
  const newBooks = backup.books.filter((b) => !existingBookIds.has(b.id));
  const newSessions = backup.sessions.filter((s) => !existingSessionIds.has(s.id));
  await storage.replaceAllData(
    [...existing.books, ...newBooks],
    [...existing.sessions, ...newSessions],
  );
  return { booksCount: newBooks.length, sessionsCount: newSessions.length };
}

export function parseBackupFile(file: File): Promise<BackupData> {
  return file.text().then((t) => validateBackup(JSON.parse(t)));
}
