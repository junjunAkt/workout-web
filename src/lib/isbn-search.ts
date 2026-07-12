import type { BookSearchResult } from './reading-types';

export async function searchByISBN(isbn: string): Promise<BookSearchResult | null> {
  const [openBD, google] = await Promise.all([
    searchOpenBD(isbn),
    searchGoogleBooksByISBN(isbn),
  ]);

  if (!openBD && !google) return null;
  if (!openBD) return google;

  // Google BooksでISBN検索が失敗した場合、タイトルで再検索
  let googleData = google;
  if (!googleData && openBD.title) {
    googleData = await searchGoogleBooksByTitle(
      openBD.title,
      openBD.authors[0],
    );
  }

  if (!googleData) return openBD;

  return {
    title: openBD.title || googleData.title,
    authors:
      googleData.authors.length > 0 ? googleData.authors : openBD.authors,
    genre: openBD.genre ?? googleData.genre,
    pageCount: openBD.pageCount ?? googleData.pageCount,
    coverUrl: openBD.coverUrl ?? googleData.coverUrl,
    isbn,
  };
}

const CCODE_GENRE: Record<string, string> = {
  '00': '総記',
  '04': '情報科学',
  '10': '哲学',
  '11': '心理学',
  '14': '宗教',
  '20': '歴史',
  '21': '日本史',
  '25': '地理・旅行',
  '30': '社会科学',
  '31': '政治',
  '32': '法律',
  '33': '経済',
  '36': '社会',
  '37': '教育',
  '40': '自然科学',
  '45': '地球科学',
  '47': '医学',
  '50': '工学',
  '55': 'IT・通信',
  '60': '産業',
  '70': '芸術',
  '71': '絵画・彫刻',
  '72': '写真・映像',
  '73': '音楽',
  '74': '演劇・映画',
  '75': 'スポーツ',
  '76': '趣味・実用',
  '77': '料理・家事',
  '79': 'コミック',
  '80': '語学',
  '90': '文学',
  '91': '文芸評論',
  '93': '小説',
  '95': '詩歌・俳句',
  '97': '海外小説',
  '98': '児童文学',
};

function decodeCCode(code: string): string | undefined {
  if (code.length < 4) return undefined;
  const content = code.slice(2);
  return CCODE_GENRE[content];
}

const PAGE_EXTENT_TYPES = ['11', '00', '07', '08', '04'];

async function searchOpenBD(isbn: string): Promise<BookSearchResult | null> {
  try {
    const res = await fetch(`https://api.openbd.jp/v1/get?isbn=${isbn}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || !data[0]) return null;
    const summary = data[0].summary;
    if (!summary || !summary.title) return null;

    let authors: string[] = summary.author ? [summary.author] : [];
    let pageCount: number | undefined;
    let genre: string | undefined;

    const detail = data[0].onix?.DescriptiveDetail;
    if (detail) {
      if (Array.isArray(detail.Extent)) {
        for (const extType of PAGE_EXTENT_TYPES) {
          const pg = detail.Extent.find(
            (e: Record<string, string>) => e.ExtentType === extType,
          );
          if (pg?.ExtentValue) {
            pageCount = Number(pg.ExtentValue);
            break;
          }
        }
      }

      if (Array.isArray(detail.Subject)) {
        const cc = detail.Subject.find(
          (s: Record<string, string>) => s.SubjectSchemeIdentifier === '78',
        );
        if (cc?.SubjectCode) genre = decodeCCode(cc.SubjectCode);
      }

      if (Array.isArray(detail.Contributor)) {
        const names = detail.Contributor.map(
          (c: Record<string, unknown>) => {
            const pn = c.PersonName as Record<string, string> | undefined;
            return pn?.content;
          },
        ).filter(Boolean) as string[];
        if (names.length > 0) authors = names;
      }
    }

    return {
      title: summary.title,
      authors,
      coverUrl: summary.cover || undefined,
      pageCount,
      genre,
      isbn,
    };
  } catch {
    return null;
  }
}

async function searchGoogleBooks(
  query: string,
): Promise<BookSearchResult | null> {
  try {
    const apiKey = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY;
    const keyParam = apiKey ? `&key=${apiKey}` : '';
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}${keyParam}`,
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
    };
  } catch {
    return null;
  }
}

function searchGoogleBooksByISBN(
  isbn: string,
): Promise<BookSearchResult | null> {
  return searchGoogleBooks(`isbn:${isbn}`);
}

function searchGoogleBooksByTitle(
  title: string,
  author?: string,
): Promise<BookSearchResult | null> {
  const q = author
    ? `intitle:${title} inauthor:${author}`
    : `intitle:${title}`;
  return searchGoogleBooks(q);
}
