/**
 * Google Books APIを使った本の検索
 * ブラウザから直接APIを呼び出す（APIキー不要）
 */

import type { BookSearchResult } from './reading-types';

type GoogleBooksResponse = {
  totalItems: number;
  items?: Array<{
    volumeInfo: {
      title?: string;
      authors?: string[];
      categories?: string[];
      pageCount?: number;
      description?: string;
      imageLinks?: {
        thumbnail?: string;
        smallThumbnail?: string;
      };
    };
  }>;
};

// Google Books APIで本を検索する
export async function searchBooks(query: string): Promise<BookSearchResult[]> {
  if (!query.trim()) return [];

  const encoded = encodeURIComponent(query.trim());
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encoded}&maxResults=10&printType=books`;

  const res = await fetch(url);

  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    console.error('Google Books API エラー:', res.status, errorText);
    throw new Error(
      res.status === 429
        ? 'API利用制限に達しました。しばらく待ってから再度お試しください。'
        : `検索に失敗しました (${res.status})`,
    );
  }

  const data: GoogleBooksResponse = await res.json();
  if (!data.items || data.totalItems === 0) return [];

  return data.items
    .filter((item) => item.volumeInfo.title)
    .map((item) => {
      const v = item.volumeInfo;
      let coverUrl = v.imageLinks?.thumbnail ?? v.imageLinks?.smallThumbnail;
      if (coverUrl) {
        coverUrl = coverUrl.replace('http://', 'https://');
      }
      return {
        title: v.title ?? '',
        authors: v.authors ?? [],
        genre: v.categories?.[0],
        pageCount: v.pageCount,
        coverUrl,
        description: v.description,
      };
    });
}
