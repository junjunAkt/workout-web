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

// undefinedを除去してFirestore互換のデータにする
function clean<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

// Firestore実装（ログイン時に使用、デバイス間同期対応）
export class FirestoreReadingAdapter implements ReadingStorage {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  private docRef() {
    return doc(db, 'readingUsers', this.userId);
  }

  private async loadAll(): Promise<ReadingData> {
    const snap = await getDoc(this.docRef());
    if (!snap.exists()) return { books: [], sessions: [], activeTimer: null };
    const data = snap.data() as ReadingData;
    return {
      books: data.books ?? [],
      sessions: data.sessions ?? [],
      activeTimer: data.activeTimer ?? null,
    };
  }

  private async mergeField(field: Partial<ReadingData>): Promise<void> {
    await setDoc(this.docRef(), clean(field), { merge: true });
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
    await this.mergeField({ books: data.books });
  }

  async deleteBook(id: string): Promise<void> {
    const data = await this.loadAll();
    await this.mergeField({ books: data.books.filter((b) => b.id !== id) });
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
    await this.mergeField({ sessions: data.sessions });
  }

  async updateSession(session: ReadingSession): Promise<void> {
    const data = await this.loadAll();
    const idx = data.sessions.findIndex((s) => s.id === session.id);
    if (idx >= 0) {
      data.sessions[idx] = session;
      await this.mergeField({ sessions: data.sessions });
    }
  }

  async deleteSession(id: string): Promise<void> {
    const data = await this.loadAll();
    await this.mergeField({
      sessions: data.sessions.filter((s) => s.id !== id),
    });
  }

  async getActiveTimer(): Promise<ActiveTimer | null> {
    const data = await this.loadAll();
    return data.activeTimer;
  }

  async saveActiveTimer(timer: ActiveTimer): Promise<void> {
    await this.mergeField({ activeTimer: timer });
  }

  async clearActiveTimer(): Promise<void> {
    await this.mergeField({ activeTimer: null });
  }

  async getAllData(): Promise<{ books: Book[]; sessions: ReadingSession[] }> {
    const data = await this.loadAll();
    return { books: data.books, sessions: data.sessions };
  }

  async replaceAllData(books: Book[], sessions: ReadingSession[]): Promise<void> {
    await setDoc(this.docRef(), clean({ books, sessions, activeTimer: null }));
  }
}

// ストレージインスタンスを生成するファクトリ関数
export function createReadingStorage(userId?: string): ReadingStorage {
  if (userId) return new FirestoreReadingAdapter(userId);
  return new LocalStorageAdapter();
}
