/**
 * 読書データのストレージ抽象レイヤー
 * UI側はこのインターフェース経由でデータにアクセスする。
 * 現在はLocalStorageAdapterを使用し、将来FirestoreAdapterに差し替え可能。
 */

import type { Book, ReadingSession, ActiveTimer } from './reading-types';

// ストレージインターフェース
export interface ReadingStorage {
  getBooks(): Promise<Book[]>;
  getBook(id: string): Promise<Book | null>;
  saveBook(book: Book): Promise<void>;
  deleteBook(id: string): Promise<void>;

  getSessions(bookId?: string): Promise<ReadingSession[]>;
  saveSession(session: ReadingSession): Promise<void>;
  updateSession(session: ReadingSession): Promise<void>;
  deleteSession(id: string): Promise<void>;

  getActiveTimer(): Promise<ActiveTimer | null>;
  saveActiveTimer(timer: ActiveTimer): Promise<void>;
  clearActiveTimer(): Promise<void>;
}

// localStorageのキー
const BOOKS_KEY = 'reading_books_v1';
const SESSIONS_KEY = 'reading_sessions_v1';
const TIMER_KEY = 'reading_active_timer_v1';

// localStorage実装
export class LocalStorageAdapter implements ReadingStorage {
  async getBooks(): Promise<Book[]> {
    const json = localStorage.getItem(BOOKS_KEY);
    return json ? JSON.parse(json) : [];
  }

  async getBook(id: string): Promise<Book | null> {
    const books = await this.getBooks();
    return books.find((b) => b.id === id) ?? null;
  }

  async saveBook(book: Book): Promise<void> {
    const books = await this.getBooks();
    const idx = books.findIndex((b) => b.id === book.id);
    if (idx >= 0) {
      books[idx] = book;
    } else {
      books.push(book);
    }
    localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
  }

  async deleteBook(id: string): Promise<void> {
    const books = await this.getBooks();
    localStorage.setItem(
      BOOKS_KEY,
      JSON.stringify(books.filter((b) => b.id !== id)),
    );
  }

  async getSessions(bookId?: string): Promise<ReadingSession[]> {
    const json = localStorage.getItem(SESSIONS_KEY);
    const sessions: ReadingSession[] = json ? JSON.parse(json) : [];
    return bookId ? sessions.filter((s) => s.bookId === bookId) : sessions;
  }

  async saveSession(session: ReadingSession): Promise<void> {
    const json = localStorage.getItem(SESSIONS_KEY);
    const sessions: ReadingSession[] = json ? JSON.parse(json) : [];
    sessions.push(session);
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  }

  async updateSession(session: ReadingSession): Promise<void> {
    const json = localStorage.getItem(SESSIONS_KEY);
    const sessions: ReadingSession[] = json ? JSON.parse(json) : [];
    const idx = sessions.findIndex((s) => s.id === session.id);
    if (idx >= 0) {
      sessions[idx] = session;
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
    }
  }

  async deleteSession(id: string): Promise<void> {
    const json = localStorage.getItem(SESSIONS_KEY);
    const sessions: ReadingSession[] = json ? JSON.parse(json) : [];
    localStorage.setItem(
      SESSIONS_KEY,
      JSON.stringify(sessions.filter((s) => s.id !== id)),
    );
  }

  async getActiveTimer(): Promise<ActiveTimer | null> {
    const json = localStorage.getItem(TIMER_KEY);
    return json ? JSON.parse(json) : null;
  }

  async saveActiveTimer(timer: ActiveTimer): Promise<void> {
    localStorage.setItem(TIMER_KEY, JSON.stringify(timer));
  }

  async clearActiveTimer(): Promise<void> {
    localStorage.removeItem(TIMER_KEY);
  }
}

// デフォルトのストレージインスタンス
export const readingStorage: ReadingStorage = new LocalStorageAdapter();
