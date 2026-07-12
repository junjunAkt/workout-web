import type { BookSearchResult } from './reading-types';

export async function searchByISBN(isbn: string): Promise<BookSearchResult | null> {
  const [openBD, google] = await Promise.all([
    searchOpenBD(isbn),
    searchGoogleBooksByISBN(isbn),
  ]);

  if (!openBD && !google) return null;
  if (!openBD) return google;
  if (!google) return openBD;

  return {
    title: openBD.title || google.title,
    authors: google.authors.length > 0 ? google.authors : openBD.authors,
    genre: google.genre ?? openBD.genre,
    pageCount: google.pageCount ?? openBD.pageCount,
    coverUrl: openBD.coverUrl ?? google.coverUrl,
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
        const pg = detail.Extent.find(
          (e: Record<string, string>) => e.ExtentType === '11',
        );
        if (pg?.ExtentValue) pageCount = Number(pg.ExtentValue);
      }

      if (Array.isArray(detail.Subject)) {
        const cc = detail.Subject.find(
          (s: Record<string, string>) => s.SubjectSchemeIdentifier === '78',
        );
        if (cc?.SubjectCode) genre = decodeCCode(cc.SubjectCode);
      }

      if (Array.isArray(detail.Contributor)) {
        const names = detail.Contributor
          .map((c: Record<string, unknown>) => {
            const pn = c.PersonName as Record<string, string> | undefined;
            return pn?.content;
          })
          .filter(Boolean) as string[];
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
