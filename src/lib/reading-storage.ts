/**
 * 読書データのストレージ抽象レイヤー
 * UI側はこのインターフェース経由でデータにアクセスする。
 * 現在はLocalStorageAdapterを使用し、将来FirestoreAdapterに差し替え可能。
 */

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
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

  getAllData(): Promise<{ books: Book[]; sessions: ReadingSession[] }>;
  replaceAllData(books: Book[], sessions: ReadingSession[]): Promise<void>;
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

  async getAllData(): Promise<{ books: Book[]; sessions: ReadingSession[] }> {
    return {
      books: await this.getBooks(),
      sessions: await this.getSessions(),
    };
  }

  async replaceAllData(books: Book[], sessions: ReadingSession[]): Promise<void> {
    localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  }
}

// Firestoreに保存するデータの形
type ReadingData = {
  books: Book[];
  sessions: ReadingSession[];
  activeTimer: ActiveTimer | null;
};

// Firestore実装（ログイン時に使用、デバイス間同期対応）
export class FirestoreReadingAdapter implements ReadingStorage {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  private async loadAll(): Promise<ReadingData> {
    try {
      const ref = doc(db, 'readingUsers', this.userId);
      const snap = await getDoc(ref);
      if (!snap.exists()) return { books: [], sessions: [], activeTimer: null };
      const data = snap.data() as ReadingData;
      return {
        books: data.books ?? [],
        sessions: data.sessions ?? [],
        activeTimer: data.activeTimer ?? null,
      };
    } catch (e) {
      console.error('読書データ読み込みエラー', e);
      return { books: [], sessions: [], activeTimer: null };
    }
  }

  private async saveAll(data: ReadingData): Promise<void> {
    try {
      const ref = doc(db, 'readingUsers', this.userId);
      await setDoc(ref, data);
    } catch (e) {
      console.error('読書データ保存エラー', e);
    }
  }

  async getBooks(): Promise<Book[]> {
    const data = await this.loadAll();
    return data.books;
  }

  async getBook(id: string): Promise<Book | null> {
    const data = await this.loadAll();
    return data.books.find((b) => b.id === id) ?? null;
  }

  async saveBook(book: Book): Promise<void> {
    const data = await this.loadAll();
    const idx = data.books.findIndex((b) => b.id === book.id);
    if (idx >= 0) {
      data.books[idx] = book;
    } else {
      data.books.push(book);
    }
    await this.saveAll(data);
  }

  async deleteBook(id: string): Promise<void> {
    const data = await this.loadAll();
    data.books = data.books.filter((b) => b.id !== id);
    await this.saveAll(data);
  }

  async getSessions(bookId?: string): Promise<ReadingSession[]> {
    const data = await this.loadAll();
    return bookId
      ? data.sessions.filter((s) => s.bookId === bookId)
      : data.sessions;
  }

  async saveSession(session: ReadingSession): Promise<void> {
    const data = await this.loadAll();
    data.sessions.push(session);
    await this.saveAll(data);
  }

  async updateSession(session: ReadingSession): Promise<void> {
    const data = await this.loadAll();
    const idx = data.sessions.findIndex((s) => s.id === session.id);
    if (idx >= 0) {
      data.sessions[idx] = session;
      await this.saveAll(data);
    }
  }

  async deleteSession(id: string): Promise<void> {
    const data = await this.loadAll();
    data.sessions = data.sessions.filter((s) => s.id !== id);
    await this.saveAll(data);
  }

  async getActiveTimer(): Promise<ActiveTimer | null> {
    const data = await this.loadAll();
    return data.activeTimer;
  }

  async saveActiveTimer(timer: ActiveTimer): Promise<void> {
    try {
      const ref = doc(db, 'readingUsers', this.userId);
      await setDoc(ref, { activeTimer: timer }, { merge: true });
    } catch (e) {
      console.error('タイマー保存エラー', e);
    }
  }

  async clearActiveTimer(): Promise<void> {
    try {
      const ref = doc(db, 'readingUsers', this.userId);
      await setDoc(ref, { activeTimer: null }, { merge: true });
    } catch (e) {
      console.error('タイマークリアエラー', e);
    }
  }

  async getAllData(): Promise<{ books: Book[]; sessions: ReadingSession[] }> {
    const data = await this.loadAll();
    return { books: data.books, sessions: data.sessions };
  }

  async replaceAllData(books: Book[], sessions: ReadingSession[]): Promise<void> {
    const data = await this.loadAll();
    data.books = books;
    data.sessions = sessions;
    await this.saveAll(data);
  }
}

// ストレージインスタンスを生成するファクトリ関数
export function createReadingStorage(userId?: string): ReadingStorage {
  if (userId) return new FirestoreReadingAdapter(userId);
  return new LocalStorageAdapter();
}
