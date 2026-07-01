/**
 * 読書管理アプリのデータ型定義
 */

// 本の情報
export type Book = {
  id: string;
  title: string;
  author?: string;
  genre?: string;
  totalPages?: number;
  coverUrl?: string;
  rating?: 1 | 2 | 3 | 4 | 5;
  status: 'reading' | 'finished';
  createdAt: number;
};

// Google Books APIの検索結果
export type BookSearchResult = {
  title: string;
  authors: string[];
  genre?: string;
  pageCount?: number;
  coverUrl?: string;
  description?: string;
};

// 1回の読書セッション
export type ReadingSession = {
  id: string;
  bookId: string;
  startTime: number;
  endTime: number;
  durationSec: number;
  pageFrom?: number;
  pageTo?: number;
  impression: string;
  createdAt: number;
};

// 計測中のタイマー状態（ブラウザ復帰時の復元用）
export type ActiveTimer = {
  bookId: string;
  startTime: number;
};
