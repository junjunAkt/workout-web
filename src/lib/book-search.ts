/**
 * Google Books APIを使った本の検索
 * APIキー不要で利用可能（レートリミットあり）
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
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encoded}&maxResults=8&langRestrict=ja&printType=books`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('検索に失敗しました');

  const data: GoogleBooksResponse = await res.json();
  if (!data.items) return [];

  return data.items
    .filter((item) => item.volumeInfo.title)
    .map((item) => {
      const v = item.volumeInfo;
      // サムネイルURLをHTTPSに変換
      const coverUrl = v.imageLinks?.thumbnail?.replace(
        'http://',
        'https://',
      );
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
