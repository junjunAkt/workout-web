/**
 * 読書データ管理Context
 * UI側はこのContextを通じてデータにアクセスする。
 * ストレージの実体（localStorage / Firestore）を意識しない。
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import type { Book, ReadingSession, ActiveTimer } from '../lib/reading-types';
import { readingStorage } from '../lib/reading-storage';

type ReadingContextType = {
  books: Book[];
  activeTimer: ActiveTimer | null;
  loading: boolean;

  addBook(data: {
    title: string;
    author?: string;
    genre?: string;
    totalPages?: number;
  }): Promise<Book>;
  updateBook(book: Book): Promise<void>;
  deleteBook(id: string): Promise<void>;

  startTimer(bookId: string): Promise<void>;
  stopTimer(): Promise<{ bookId: string; startTime: number; endTime: number }>;

  saveSession(data: Omit<ReadingSession, 'id' | 'createdAt'>): Promise<void>;
  getSessionsForBook(bookId: string): Promise<ReadingSession[]>;
  getAllSessions(): Promise<ReadingSession[]>;
  updateSession(session: ReadingSession): Promise<void>;
  deleteSession(id: string): Promise<void>;
};

const ReadingContext = createContext<ReadingContextType | null>(null);

export function useReading() {
  const ctx = useContext(ReadingContext);
  if (!ctx) throw new Error('useReading must be used within ReadingProvider');
  return ctx;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function ReadingProvider({ children }: { children: React.ReactNode }) {
  const [books, setBooks] = useState<Book[]>([]);
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);
  const [loading, setLoading] = useState(true);

  // 初期ロード（本一覧とタイマー状態を復元）
  useEffect(() => {
    (async () => {
      const [loadedBooks, timer] = await Promise.all([
        readingStorage.getBooks(),
        readingStorage.getActiveTimer(),
      ]);
      setBooks(loadedBooks);
      setActiveTimer(timer);
      setLoading(false);
    })();
  }, []);

  const addBook = useCallback(
    async (data: {
      title: string;
      author?: string;
      genre?: string;
      totalPages?: number;
    }) => {
      const book: Book = {
        ...data,
        id: generateId(),
        status: 'reading',
        createdAt: Date.now(),
      };
      await readingStorage.saveBook(book);
      setBooks((prev) => [...prev, book]);
      return book;
    },
    [],
  );

  const updateBook = useCallback(async (book: Book) => {
    await readingStorage.saveBook(book);
    setBooks((prev) => prev.map((b) => (b.id === book.id ? book : b)));
  }, []);

  const deleteBook = useCallback(async (id: string) => {
    await readingStorage.deleteBook(id);
    setBooks((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const startTimer = useCallback(async (bookId: string) => {
    const timer: ActiveTimer = { bookId, startTime: Date.now() };
    await readingStorage.saveActiveTimer(timer);
    setActiveTimer(timer);
  }, []);

  const stopTimer = useCallback(async () => {
    if (!activeTimer) throw new Error('タイマーが動作していません');
    const endTime = Date.now();
    await readingStorage.clearActiveTimer();
    const result = {
      bookId: activeTimer.bookId,
      startTime: activeTimer.startTime,
      endTime,
    };
    setActiveTimer(null);
    return result;
  }, [activeTimer]);

  const saveSession = useCallback(
    async (data: Omit<ReadingSession, 'id' | 'createdAt'>) => {
      const session: ReadingSession = {
        ...data,
        id: generateId(),
        createdAt: Date.now(),
      };
      await readingStorage.saveSession(session);
    },
    [],
  );

  const getSessionsForBook = useCallback(async (bookId: string) => {
    return readingStorage.getSessions(bookId);
  }, []);

  const getAllSessions = useCallback(async () => {
    return readingStorage.getSessions();
  }, []);

  const updateSession = useCallback(async (session: ReadingSession) => {
    await readingStorage.updateSession(session);
  }, []);

  const deleteSession = useCallback(async (id: string) => {
    await readingStorage.deleteSession(id);
  }, []);

  return (
    <ReadingContext.Provider
      value={{
        books,
        activeTimer,
        loading,
        addBook,
        updateBook,
        deleteBook,
        startTimer,
        stopTimer,
        saveSession,
        getSessionsForBook,
        getAllSessions,
        updateSession,
        deleteSession,
      }}
    >
      {children}
    </ReadingContext.Provider>
  );
}
