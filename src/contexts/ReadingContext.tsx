/**
 * 読書データ管理Context
 * ログイン時はFirestore、未ログイン時はlocalStorageを使用する。
 * UI側はストレージの実体を意識しない。
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import type { Book, ReadingSession, ActiveTimer } from '../lib/reading-types';
import type { ReadingStorage } from '../lib/reading-storage';
import { createReadingStorage } from '../lib/reading-storage';
import {
  exportData,
  exportImpressions,
  importReplace,
  importMerge,
} from '../lib/reading-backup';
import type { ImportResult } from '../lib/reading-backup';
import { useAuth } from './AuthContext';

type ReadingContextType = {
  books: Book[];
  activeTimer: ActiveTimer | null;
  loading: boolean;

  addBook(data: {
    title: string;
    author?: string;
    genre?: string;
    totalPages?: number;
    coverUrl?: string;
    isbn?: string;
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

  handleExport(): Promise<void>;
  handleExportImpressions(): Promise<void>;
  handleImportReplace(file: File): Promise<ImportResult>;
  handleImportMerge(file: File): Promise<ImportResult>;
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
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);
  const [loading, setLoading] = useState(true);

  // ログイン状態に応じてストレージを切り替え
  const storage: ReadingStorage = useMemo(
    () => createReadingStorage(user?.uid),
    [user?.uid],
  );

  // ユーザーが変わったらデータを再読み込み
  useEffect(() => {
    setLoading(true);
    (async () => {
      const [loadedBooks, timer] = await Promise.all([
        storage.getBooks(),
        storage.getActiveTimer(),
      ]);
      setBooks(loadedBooks);
      setActiveTimer(timer);
      setLoading(false);
    })();
  }, [storage]);

  const addBook = useCallback(
    async (data: {
      title: string;
      author?: string;
      genre?: string;
      totalPages?: number;
      coverUrl?: string;
      isbn?: string;
    }) => {
      const book: Book = {
        ...data,
        id: generateId(),
        status: 'reading',
        createdAt: Date.now(),
      };
      await storage.saveBook(book);
      setBooks((prev) => [...prev, book]);
      return book;
    },
    [storage],
  );

  const updateBook = useCallback(
    async (book: Book) => {
      await storage.saveBook(book);
      setBooks((prev) => prev.map((b) => (b.id === book.id ? book : b)));
    },
    [storage],
  );

  const deleteBook = useCallback(
    async (id: string) => {
      await storage.deleteBook(id);
      setBooks((prev) => prev.filter((b) => b.id !== id));
    },
    [storage],
  );

  const startTimer = useCallback(
    async (bookId: string) => {
      const timer: ActiveTimer = { bookId, startTime: Date.now() };
      await storage.saveActiveTimer(timer);
      setActiveTimer(timer);
    },
    [storage],
  );

  const stopTimer = useCallback(async () => {
    if (!activeTimer) throw new Error('タイマーが動作していません');
    const endTime = Date.now();
    await storage.clearActiveTimer();
    const result = {
      bookId: activeTimer.bookId,
      startTime: activeTimer.startTime,
      endTime,
    };
    setActiveTimer(null);
    return result;
  }, [activeTimer, storage]);

  const saveSession = useCallback(
    async (data: Omit<ReadingSession, 'id' | 'createdAt'>) => {
      const session: ReadingSession = {
        ...data,
        id: generateId(),
        createdAt: Date.now(),
      };
      await storage.saveSession(session);
    },
    [storage],
  );

  const getSessionsForBook = useCallback(
    async (bookId: string) => {
      return storage.getSessions(bookId);
    },
    [storage],
  );

  const getAllSessions = useCallback(async () => {
    return storage.getSessions();
  }, [storage]);

  const updateSession = useCallback(
    async (session: ReadingSession) => {
      await storage.updateSession(session);
    },
    [storage],
  );

  const deleteSession = useCallback(
    async (id: string) => {
      await storage.deleteSession(id);
    },
    [storage],
  );

  const reloadData = useCallback(async () => {
    const [loadedBooks, timer] = await Promise.all([
      storage.getBooks(),
      storage.getActiveTimer(),
    ]);
    setBooks(loadedBooks);
    setActiveTimer(timer);
  }, [storage]);

  const handleExport = useCallback(async () => {
    await exportData(storage);
  }, [storage]);

  const handleExportImpressions = useCallback(async () => {
    await exportImpressions(storage);
  }, [storage]);

  const handleImportReplace = useCallback(
    async (file: File) => {
      const result = await importReplace(storage, file);
      await reloadData();
      return result;
    },
    [storage, reloadData],
  );

  const handleImportMerge = useCallback(
    async (file: File) => {
      const result = await importMerge(storage, file);
      await reloadData();
      return result;
    },
    [storage, reloadData],
  );

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
        handleExport,
        handleExportImpressions,
        handleImportReplace,
        handleImportMerge,
      }}
    >
      {children}
    </ReadingContext.Provider>
  );
}
