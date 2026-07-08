import type { BookSearchResult } from './reading-types';

export async function searchByISBN(isbn: string): Promise<BookSearchResult | null> {
  const result = await searchOpenBD(isbn);
  if (result) return result;
  return searchGoogleBooksByISBN(isbn);
}

async function searchOpenBD(isbn: string): Promise<BookSearchResult | null> {
  try {
    const res = await fetch(`https://api.openbd.jp/v1/get?isbn=${isbn}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || !data[0]) return null;
    const summary = data[0].summary;
    if (!summary || !summary.title) return null;
    return {
      title: summary.title,
      authors: summary.author ? [summary.author] : [],
      coverUrl: summary.cover || undefined,
      pageCount: undefined,
      isbn,
    };
  } catch {
    return null;
  }
}

async function searchGoogleBooksByISBN(isbn: string): Promise<BookSearchResult | null> {
  try {
    const apiKey = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY;
    const keyParam = apiKey ? `&key=${apiKey}` : '';
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}${keyParam}`,
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.items || data.items.length === 0) return null;
    const info = data.items[0].volumeInfo;
    return {
      title: info.title ?? '',
      authors: info.authors ?? [],
      pageCount: info.pageCount,
      coverUrl: info.imageLinks?.thumbnail?.replace('http://', 'https://'),
      genre: info.categories?.[0],
      isbn,
    };
  } catch {
    return null;
  }
}
